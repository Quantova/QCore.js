const fs = require('fs');
const path = require('path');
const core = require('./pkg-node/qcore_js.js');

const dir = path.join(__dirname, 'conformance');
const load = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));

let failures = 0;
function check(label, got, want) {
  if (got === want) {
    console.log('  ok   ' + label);
  } else {
    failures += 1;
    console.log('  FAIL ' + label + '\n         got  ' + got + '\n         want ' + want);
  }
}

function bech32Equal(a, b) {
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function bytesFromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return out;
}

function hexFromBytes(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function reader(hex) {
  const bytes = bytesFromHex(hex);
  let at = 0;
  const uint = (n) => {
    let value = 0n;
    for (let i = 0; i < n; i += 1) value |= BigInt(bytes[at + i]) << (8n * BigInt(i));
    at += n;
    return value;
  };
  const take = (n) => {
    const slice = bytes.slice(at, at + n);
    at += n;
    return slice;
  };
  return { uint, take, offset: () => at };
}

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 734539939;
const GENERATOR = [996825010, 642813549, 513874426, 1027748829, 705979059];

function polymod(values) {
  let chk = 1;
  for (const value of values) {
    const top = chk >>> 25;
    chk = ((chk & 33554431) << 5) ^ value;
    for (let bit = 0; bit < 5; bit += 1) {
      if ((top >>> bit) & 1) chk ^= GENERATOR[bit];
    }
  }
  return chk >>> 0;
}

function hrpExpand(hrp) {
  const bytes = Array.from(hrp.toLowerCase(), (c) => c.charCodeAt(0));
  const out = bytes.map((b) => b >>> 5);
  out.push(0);
  for (const b of bytes) out.push(b & 31);
  return out;
}

function convertBits(data, from, to) {
  let acc = 0;
  let bits = 0;
  const maxValue = (1 << to) - 1;
  const out = [];
  for (const value of data) {
    acc = ((acc << from) | value) >>> 0;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >>> bits) & maxValue);
    }
  }
  return out;
}

function decodeBech32m(text) {
  const hasLower = /[a-z]/.test(text);
  const hasUpper = /[A-Z]/.test(text);
  if (hasLower && hasUpper) throw new Error('the string mixes upper and lower case');
  const lowered = text.toLowerCase();
  const separator = lowered.lastIndexOf('1');
  const hrp = lowered.slice(0, separator);
  const body = lowered.slice(separator + 1);
  const groups = Array.from(body, (c) => CHARSET.indexOf(c));
  if (groups.some((g) => g < 0)) throw new Error('the string holds a character outside the alphabet');
  if (polymod(hrpExpand(hrp).concat(groups)) !== BECH32M_CONST) throw new Error('the checksum does not verify');
  const payload = convertBits(groups.slice(0, groups.length - 6), 5, 8);
  return { hrp, payload: new Uint8Array(payload) };
}

function parseBody(hex) {
  const r = reader(hex);
  const sender = new TextDecoder().decode(r.take(Number(r.uint(8))));
  const nonce = r.uint(8);
  const meter = r.uint(8);
  const fee = r.uint(16);
  const target = new TextDecoder().decode(r.take(Number(r.uint(8))));
  const args = hexFromBytes(r.take(Number(r.uint(8))));
  const value = r.uint(8);
  const chainId = r.uint(8);
  return { sender, nonce, meter, fee, target, args, value, chainId, length: r.offset() };
}

function parsePayableBody(hex) {
  const r = reader(hex);
  const sender = hexFromBytes(r.take(Number(r.uint(8))));
  const nonce = r.uint(8);
  const meter = r.uint(8);
  const fee = r.uint(16);
  const target = hexFromBytes(r.take(Number(r.uint(8))));
  const args = hexFromBytes(r.take(Number(r.uint(8))));
  const value = r.uint(8);
  const chainId = r.uint(8);
  return { sender, nonce, meter, fee, target, args, value, chainId, length: r.offset() };
}

function addressVector() {
  console.log('address.derivation');
  const v = load('address.derivation.json');
  const derived = core.address(v.master_seed, BigInt(v.index));
  check('address matches the vector as bech32', bech32Equal(derived, v.canonical) && core.valid_address(derived), true);
  check('the rendered address is uppercase Q1', derived === derived.toUpperCase(), true);
}

function transactionVector() {
  console.log('transaction.transfer');
  const v = load('transaction.transfer.json');

  const sender = core.address(v.master_seed, BigInt(v.sender_index));
  const target = core.address(v.master_seed, BigInt(v.target_index));
  check('sender derives to the vector sender', bech32Equal(sender, v.sender), true);
  check('target derives to the vector target', bech32Equal(target, v.target), true);

  const signed = JSON.parse(
    core.sign_call(v.master_seed, BigInt(v.sender_index), target, v.args, BigInt(v.nonce), BigInt(v.gas_limit), String(v.fee), core.localChainId()),
  );
  check('the signer address is the vector sender', bech32Equal(signed.from, v.sender), true);

  const want = parseBody(v.body_bytes);
  const got = parseBody(signed.tx_hex);
  check('serialized sender field', bech32Equal(got.sender, want.sender), true);
  check('serialized nonce field', got.nonce === want.nonce, true);
  check('serialized meter field', got.meter === want.meter, true);
  check('serialized fee field', got.fee === want.fee, true);
  check('serialized target field', bech32Equal(got.target, want.target), true);
  check('serialized args field', got.args === want.args, true);
  check('serialized value field', got.value === want.value, true);
  check('serialized chain id field', got.chainId === want.chainId, true);
  check('body length matches the vector', got.length === want.length, true);
  check('an unset value defaults to zero', got.value === 0n, true);
  check('an unset chain id defaults to the local chain', got.chainId === core.localChainId(), true);

  const again = JSON.parse(
    core.sign_call(v.master_seed, BigInt(v.sender_index), target, v.args, BigInt(v.nonce), BigInt(v.gas_limit), String(v.fee), core.localChainId()),
  );
  check('signing is deterministic', again.tx_hex === signed.tx_hex, true);
  check('the transaction id is a qtx identifier', /^qtx1[0-9a-z]+$/i.test(signed.tx_id), true);
  check('the transaction id is rendered uppercase Q1', signed.tx_id === signed.tx_id.toUpperCase(), true);
}

function payableVector() {
  console.log('transaction.payable');
  const v = load('transaction.payable.json');

  const sender = core.address(v.master_seed, BigInt(v.sender_index));
  const target = core.address(v.master_seed, BigInt(v.target_index));
  check('sender derives to the vector sender', bech32Equal(sender, v.sender), true);
  check('target derives to the vector target', bech32Equal(target, v.target), true);

  const signed = JSON.parse(
    core.signPayableCall(
      v.master_seed,
      BigInt(v.sender_index),
      target,
      v.args,
      BigInt(v.nonce),
      BigInt(v.gas_limit),
      String(v.fee),
      String(v.value),
      BigInt(v.chain_id),
    ),
  );
  check('the payable helper matches the frozen from', signed.from === v.sender, true);
  check('the payable helper matches the frozen tx id', signed.tx_id === v.tx_id, true);
  check('the payable helper matches the frozen tx hex byte for byte', signed.tx_hex === v.tx_hex, true);

  const got = parsePayableBody(signed.tx_hex);
  const senderPayload = hexFromBytes(decodeBech32m(sender).payload);
  const targetPayload = hexFromBytes(decodeBech32m(target).payload);
  check('the sender field is the raw 32 byte payload, not the rendered string', got.sender === senderPayload, true);
  check('the target field is the raw 32 byte payload, not the rendered string', got.target === targetPayload, true);
  check('the sender field is 32 bytes', got.sender.length === 64, true);
  check('the target field is 32 bytes', got.target.length === 64, true);
  check('the value field carries the vector value', got.value === BigInt(v.value), true);
  check('the chain id field carries the vector chain id', got.chainId === BigInt(v.chain_id), true);

  const lower = target.toLowerCase();
  const upper = target.toUpperCase();
  const signedLower = JSON.parse(
    core.signPayableCall(v.master_seed, BigInt(v.sender_index), lower, v.args, BigInt(v.nonce), BigInt(v.gas_limit), String(v.fee), String(v.value), BigInt(v.chain_id)),
  );
  const signedUpper = JSON.parse(
    core.signPayableCall(v.master_seed, BigInt(v.sender_index), upper, v.args, BigInt(v.nonce), BigInt(v.gas_limit), String(v.fee), String(v.value), BigInt(v.chain_id)),
  );
  check('signing a lowercase and an uppercase target binds the same bytes', signedLower.tx_hex === signedUpper.tx_hex, true);
  check('signing a differently cased target still matches the frozen vector', signedLower.tx_hex === v.tx_hex, true);
}

addressVector();
transactionVector();
payableVector();

if (failures > 0) {
  console.error('\nconformance: ' + failures + ' checks failed');
  process.exit(1);
}
console.log('\nconformance: the JavaScript binding matches the frozen vectors');
