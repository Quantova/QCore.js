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

function parseBody(hex) {
  const r = reader(hex);
  const sender = new TextDecoder().decode(r.take(Number(r.uint(8))));
  const nonce = r.uint(8);
  const meter = r.uint(8);
  const fee = r.uint(16);
  const target = new TextDecoder().decode(r.take(Number(r.uint(8))));
  const args = Array.from(r.take(Number(r.uint(8))), (b) => b.toString(16).padStart(2, '0')).join('');
  return { sender, nonce, meter, fee, target, args, length: r.offset() };
}

function addressVector() {
  console.log('address.derivation');
  const v = load('address.derivation.json');
  const derived = core.address(v.master_seed, BigInt(v.index));
  check('address matches the vector as bech32', bech32Equal(derived, v.canonical) && core.valid_address(derived), true);
}

function transactionVector() {
  console.log('transaction.transfer');
  const v = load('transaction.transfer.json');

  const sender = core.address(v.master_seed, BigInt(v.sender_index));
  const target = core.address(v.master_seed, BigInt(v.target_index));
  check('sender derives to the vector sender', bech32Equal(sender, v.sender), true);
  check('target derives to the vector target', bech32Equal(target, v.target), true);

  const signed = JSON.parse(
    core.sign_call(v.master_seed, BigInt(v.sender_index), target, v.args, BigInt(v.nonce), BigInt(v.gas_limit), String(v.fee)),
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
  check('body length matches the vector', got.length === want.length, true);

  const again = JSON.parse(
    core.sign_call(v.master_seed, BigInt(v.sender_index), target, v.args, BigInt(v.nonce), BigInt(v.gas_limit), String(v.fee)),
  );
  check('signing is deterministic', again.tx_hex === signed.tx_hex, true);
  check('the transaction id is a qtx identifier', /^qtx1[0-9a-z]+$/i.test(signed.tx_id), true);
}

addressVector();
transactionVector();

if (failures > 0) {
  console.error('\nconformance: ' + failures + ' checks failed');
  process.exit(1);
}
console.log('\nconformance: the JavaScript binding matches the frozen vectors');
