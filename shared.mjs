// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const MAX_RESPONSE = 8 * 1024 * 1024;
const TIMEOUT_MS = 20000;

function feeCeiling(maxFeeQuon) {
  if (typeof maxFeeQuon === 'number') {
    throw new Error('pass the maximum fee as a decimal string or a BigInt, never a JavaScript number, because a number silently rounds above 2^53 and could set the ceiling higher than you intended');
  }
  let ceiling;
  try {
    ceiling = BigInt(maxFeeQuon);
  } catch {
    throw new Error('the maximum fee must be an integer number of Quon');
  }
  if (ceiling < 0n) throw new Error('the maximum fee cannot be negative');
  return ceiling;
}

function checkAmount(amount) {
  if (typeof amount === 'number') {
    throw new Error('pass the amount as a decimal string or a BigInt, never a JavaScript number, because a number silently rounds above 2^53 and would sign a wrong amount');
  }
  if (typeof amount !== 'string' && typeof amount !== 'bigint') {
    throw new Error('the amount must be a decimal string or a BigInt');
  }
}

function accountIndex(index) {
  if (typeof index === 'number' && !Number.isSafeInteger(index)) {
    throw new Error('the account index must be a whole number in the safe integer range, a number that large silently rounds and would sign with a different account key');
  }
  let i;
  try {
    i = BigInt(index);
  } catch {
    throw new Error('the account index must be a whole number');
  }
  if (i < 0n || i > 0xffffffffffffffffn) {
    throw new Error('the account index must fit in an unsigned 64 bit integer');
  }
  return i;
}

function accountNonce(nonce) {
  if (typeof nonce === 'number' && !Number.isSafeInteger(nonce)) {
    throw new Error('the gateway reported a nonce outside the safe integer range, a number that large silently rounds and would sign a different nonce');
  }
  let n;
  try {
    n = BigInt(nonce);
  } catch {
    throw new Error('the gateway reported a nonce that is not a whole number');
  }
  if (n < 0n || n > 0xffffffffffffffffn) {
    throw new Error('the gateway reported a nonce outside the unsigned 64 bit range');
  }
  return n;
}

const VALIDITY_BLOCKS = 300n;
const MAX_PLAUSIBLE_HEAD = 1n << 40n;
const HEAD_BLOCKS_PER_SEC = 4n;
const HEAD_SLACK_SECS = 60n;
const U64_MAX = 0xffffffffffffffffn;
const U128_MAX = (1n << 128n) - 1n;

function wholeNumber(value, label, max) {
  let n;
  if (typeof value === 'bigint') {
    n = value;
  } else if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error(`the ${label} must be a whole number in the safe integer range, a number outside it silently rounds, pass a decimal string or a BigInt`);
    }
    n = BigInt(value);
  } else if (typeof value === 'string' && /^[0-9]+$/.test(value)) {
    n = BigInt(value);
  } else {
    throw new Error(`the ${label} must be a string of decimal digits, a BigInt, or a safe integer number`);
  }
  if (n < 0n || n > max) {
    throw new Error(`the ${label} must be a whole number from 0 to ${max}`);
  }
  return n;
}

function coreArg(kind, label, value) {
  if (kind === 'text') {
    if (typeof value !== 'string') throw new Error(`the ${label} must be a string`);
    return value;
  }
  if (kind === 'u64') return wholeNumber(value, label, U64_MAX);
  if (kind === 'u64s') return wholeNumber(value, label, U64_MAX).toString();
  if (kind === 'u128s') return wholeNumber(value, label, U128_MAX).toString();
  throw new Error(`unknown argument kind ${kind}`);
}

const CORE_ARGS = {
  address: [['text', 'seed'], ['u64', 'account index']],
  mnemonicFromSeed: [['text', 'seed']],
  seedFromMnemonic: [['text', 'recovery phrase']],
  orderSigner: [['text', 'seed'], ['u64', 'account index']],
  sign_transfer: [['text', 'seed'], ['u64', 'account index'], ['text', 'recipient'], ['u64s', 'amount'], ['u64', 'nonce'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline']],
  signRegister: [['text', 'seed'], ['u64', 'account index'], ['u64', 'nonce'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline']],
  sign_call: [['text', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee']],
  signPayableCall: [['text', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64s', 'value'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee']],
  signAssetCall: [['text', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['text', 'asset issuer'], ['u64s', 'amount'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee']],
  buildSignedOrderCall: [['u64', 'chain id'], ['text', 'contract'], ['text', 'selector'], ['u64', 'scheme offset'], ['u64', 'pointer offset'], ['text', 'field offsets'], ['text', 'fields'], ['u64', 'region offset'], ['text', 'owner seed'], ['u64', 'owner index'], ['u64', 'order nonce']],
  buildTypedOrderCall: [['u64', 'chain id'], ['text', 'contract'], ['text', 'selector'], ['u64', 'scheme offset'], ['u64', 'pointer offset'], ['u64', 'region offset'], ['text', 'fields'], ['text', 'owner seed'], ['u64', 'owner index'], ['u64', 'order nonce']],
  contractAddress: [['text', 'deployer'], ['u64', 'nonce']],
  scalarSlotKey: [['u64', 'slot']],
  mapSlotKey: [['u64', 'map domain tag'], ['text', 'key address']],
  mapAddrWordKey: [['u64', 'map domain tag'], ['text', 'key'], ['u64', 'word']],
  unpackSymbol: [['u64', 'symbol word']],
  eventsBody: [['u64', 'height']],
  block_by_height_body: [['u64', 'height']],
  vmCallFee: [['u128s', 'transfer fee'], ['u64', 'meter limit']],
  checkValidUntil: [['u64', 'validity deadline'], ['u64', 'head height']],
};

function wrapCore(raw) {
  const core = Object.assign({}, raw);
  for (const [name, kinds] of Object.entries(CORE_ARGS)) {
    const fn = raw[name];
    if (typeof fn !== 'function') continue;
    core[name] = (...args) => fn(...kinds.map(([kind, label], i) => coreArg(kind, label, args[i])));
  }
  const fee = core.vmCallFee;
  if (typeof fee === 'function') core.vmCallFee = (transferFee, meterLimit) => BigInt(fee(transferFee, meterLimit));
  return Object.freeze(core);
}

function isMainnetChain(name) {
  return name.startsWith('Q-main-net-');
}

function isPublicChain(name) {
  return name.startsWith('Q-test-net-') || isMainnetChain(name);
}

function meterLimitOf(meterLimit) {
  if (typeof meterLimit === 'number' && !Number.isSafeInteger(meterLimit)) {
    throw new Error('the meter limit must be a whole number in the safe integer range');
  }
  let meter;
  try {
    meter = BigInt(meterLimit);
  } catch {
    throw new Error('the meter limit must be a whole number');
  }
  if (meter < 0n || meter > 0xffffffffffffffffn) {
    throw new Error('the meter limit must fit in an unsigned 64 bit integer');
  }
  return meter;
}

function validUntil(info) {
  const head = info && info.head_height;
  if (head == null) throw new Error('the gateway did not report a head height to bound the transaction to');
  if (typeof head === 'number' && !Number.isSafeInteger(head)) {
    throw new Error('the gateway reported a head height outside the safe integer range');
  }
  let h;
  try {
    h = BigInt(head);
  } catch {
    throw new Error('the gateway reported a head height that is not a whole number');
  }
  if (h < 0n || h > MAX_PLAUSIBLE_HEAD) {
    throw new Error('the gateway reported a head height past any height this chain can have reached');
  }
  return h + VALIDITY_BLOCKS;
}

function gatewayFee(fee) {
  if (typeof fee === 'number' && !Number.isSafeInteger(fee)) {
    throw new Error('the gateway reported a fee outside the safe integer range, a number that large silently rounds and would sign a different fee');
  }
  let f;
  try {
    f = BigInt(fee);
  } catch {
    throw new Error('the gateway reported a fee that is not a whole number');
  }
  if (f < 0n) throw new Error('the gateway reported a negative fee');
  return f;
}

async function readBounded(res) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const header = res.headers.get('content-length');
    const len = header == null ? NaN : Number(header);
    if (!Number.isFinite(len) || len <= 0) {
      throw new Error('the response has no content-length to bound it and cannot be read safely');
    }
    if (len > MAX_RESPONSE) throw new Error('the response is too large');
    return await res.text();
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE) {
      try { await reader.cancel(); } catch {}
      throw new Error('the response is too large');
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    merged.set(chunk, at);
    at += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function isLoopbackHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  if (host === 'localhost') return true;
  if (host === '::1' || host === '[::1]') return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (m) {
    const octets = [m[1], m[2], m[3], m[4]].map(Number);
    if (octets.every((o) => o <= 255) && octets[0] === 127) return true;
  }
  return false;
}

function requireSafeTransport(base) {
  let url;
  try {
    url = new URL(base);
  } catch {
    throw new Error('the gateway base must be an absolute http:// or https:// URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('the gateway base must start with http:// or https://');
  }
  if (url.protocol === 'http:' && !isLoopbackHost(url.hostname)) {
    throw new Error(
      `refusing plaintext http to a non loopback gateway (${url.hostname}); its fee and nonce would be unauthenticated and rewritable to drain funds, use https or a loopback node`,
    );
  }
  return base;
}

const DENOMINATION = 'Quon';
const DECIMALS = 6;

class Network {
  constructor(fields) {
    this.name = fields.name;
    this.chainId = fields.chainId;
    this.rpcUrl = fields.rpcUrl || null;
    this.explorerUrl = fields.explorerUrl || null;
    this.denomination = fields.denomination || DENOMINATION;
    this.decimals = fields.decimals == null ? DECIMALS : fields.decimals;
    this.isMainnet = fields.isMainnet === true;
    Object.freeze(this);
  }

  static testnet() {
    return new Network({
      name: 'testnet',
      chainId: 'Q-test-net-3',
      rpcUrl: 'https://rpc-testnet.quantova.org',
      explorerUrl: 'https://qvmscan.io',
      isMainnet: false,
    });
  }

  static mainnet() {
    return new Network({
      name: 'mainnet',
      chainId: 'Q-main-net-1',
      rpcUrl: null,
      explorerUrl: 'https://qvmscan.io',
      isMainnet: true,
    });
  }

  static forUrl(base) {
    return new Network({ name: 'custom', chainId: null, rpcUrl: base, isMainnet: false });
  }
}

function generateSeed() {
  const source = (typeof globalThis !== 'undefined' && globalThis.crypto) || (typeof crypto !== 'undefined' ? crypto : null);
  if (!source || typeof source.getRandomValues !== 'function') {
    throw new Error('no cryptographic random source is available; a secure context provides crypto.getRandomValues');
  }
  const bytes = new Uint8Array(32);
  source.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function makeClient(core) {
  return class Client {
    constructor(target, options) {
      const opts = options || {};
      this.acknowledgeMainnet = opts.acknowledgeMainnet === true;
      let base;
      if (target instanceof Network) {
        this.network = target;
        base = target.rpcUrl;
        if (!base) {
          throw new Error(`the ${target.name} network has no rpc endpoint yet, pass the endpoint explicitly with new Client(url)`);
        }
        if (target.isMainnet && !this.acknowledgeMainnet) {
          throw new Error('refusing to open a mainnet client without acknowledgeMainnet true, a mainnet transaction moves real value so the network must be chosen on purpose');
        }
      } else {
        base = String(target);
        this.network = opts.network instanceof Network ? opts.network : Network.forUrl(base);
      }
      this.base = requireSafeTransport(base).replace(/\/$/, '');
      this.expectedChainId =
        typeof opts.expectedChainId === 'string' && opts.expectedChainId.length > 0
          ? opts.expectedChainId
          : null;
      this._pinnedChainName = null;
    }

    _guardMainnet() {
      const onMainnet = this.network && this.network.isMainnet === true;
      if (onMainnet && !this.acknowledgeMainnet) {
        throw new Error(`refusing to sign for the mainnet network ${this.network.chainId || ''} without acknowledgeMainnet true, pass it when you mean to move real value`);
      }
    }

    _signingChainId(info) {
      const name = info && info.chain_id;
      if (!name) throw new Error('the gateway did not report a chain id to bind the signature to');
      if (typeof name !== 'string') throw new Error('the gateway reported a chain id that is not a string, refusing to bind a signature to it');
      const configured =
        this.expectedChainId || (this.network && this.network.chainId) || null;
      const mainnet = isMainnetChain(name);
      if (configured) {
        if (name !== configured) {
          throw new Error(`the gateway reports chain ${name} but this client is configured for ${configured}; refusing to sign a transaction that would be valid on a network you did not choose`);
        }
      } else if (isPublicChain(name) && !(mainnet && this.acknowledgeMainnet)) {
        throw new Error(`the gateway reports the public chain ${name} but this client was opened for an unnamed network; configure the testnet or mainnet network before signing for it`);
      }
      if (mainnet && !this.acknowledgeMainnet) {
        throw new Error(`the gateway reports the mainnet chain ${name}; refusing to sign a mainnet transaction without acknowledgeMainnet`);
      }
      if (this._pinnedChainName === null) {
        this._pinnedChainName = name;
      } else if (this._pinnedChainName !== name) {
        throw new Error(`the gateway reported chain ${this._pinnedChainName} earlier and now reports ${name}; refusing to sign, the endpoint is not naming one network`);
      }
      return BigInt(core.chainIdFromName(name));
    }

    async _call(method, body) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(this.base + '/v1/' + method, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body || '{}',
          signal: controller.signal,
          redirect: 'error',
        });
        const text = await readBounded(res);
        let data;
        try { data = JSON.parse(text); } catch { throw new Error('the node returned a non JSON response'); }
        if (!res.ok) {
          const detail = data && typeof data === 'object' ? (data.message || data.error) : null;
          throw new Error(detail || ('status ' + res.status));
        }
        return data;
      } finally {
        clearTimeout(timer);
      }
    }

    nodeInfo() { return this._call('node_info', '{}'); }
    head() { return this._call('head', '{}'); }
    async account(address) {
      const acct = await this._call('get_account', core.account_body(address));
      if (!acct || typeof acct.address !== 'string') {
        throw new Error(`the gateway answered about ${address} without naming the account, refusing to trust it`);
      }
      if (acct.address !== address) {
        throw new Error(`the gateway answered for ${acct.address} when asked about ${address}, refusing to trust it`);
      }
      return acct;
    }
    _checkedNonce(reported, expected, key) {
      const n = accountNonce(reported);
      if (expected != null) {
        const e = wholeNumber(expected, 'expected nonce', U64_MAX);
        if (e !== n) {
          throw new Error(`the gateway reported nonce ${n} but you expected ${e}; the chain admits only the nonce the account has reached, refusing to sign`);
        }
      }
      if (!this._nextNonces) this._nextNonces = new Map();
      if (key != null) {
        const local = this._nextNonces.get(key);
        if (local == null || local < n) this._nextNonces.set(key, n);
      }
      return n;
    }

    _guardSigned(key, slot, txHex, until, explicit) {
      if (key == null) return;
      if (!this._signedNonces) this._signedNonces = new Map();
      let held = this._signedNonces.get(key);
      if (!held) { held = new Map(); this._signedNonces.set(key, held); }
      const head = until - VALIDITY_BLOCKS;
      for (const [slotKey, entry] of held) {
        if (head > entry.until) held.delete(slotKey);
      }
      const seen = held.get(String(slot));
      if (!explicit && seen != null && seen.txHex !== txHex) {
        throw new Error(`a different transaction was already signed for nonce ${slot} in this session and was neither rejected nor expired; one nonce carries one signature, pass the nonce explicitly to replace one that never landed`);
      }
      held.set(String(slot), { txHex, until });
    }

    _remember(key, used, outcome) {
      if (!this._nextNonces) this._nextNonces = new Map();
      const verdict = outcome && outcome.verdict;
      if (verdict === 'accepted') {
        const next = BigInt(used) + 1n;
        const local = this._nextNonces.get(key);
        if (local == null || local < next) this._nextNonces.set(key, next);
      } else if (verdict === 'rejected') {
        const held = this._signedNonces && this._signedNonces.get(key);
        if (held) held.delete(String(used));
      }
    }

    _validity(info) {
      const until = validUntil(info);
      const head = until - VALIDITY_BLOCKS;
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (this._headFloor) {
        const { height, at } = this._headFloor;
        if (head < height) throw new Error(`the gateway reports head ${head} below the ${height} it reported earlier, refusing to sign`);
        const elapsed = now > at ? now - at : 0n;
        const allowed = (elapsed + HEAD_SLACK_SECS) * HEAD_BLOCKS_PER_SEC;
        if (head > height + allowed) throw new Error(`the gateway head leapt from ${height} to ${head} faster than blocks are made, refusing to sign`);
      }
      core.checkValidUntil(until, head);
      if (!this._headFloor || head > this._headFloor.height) this._headFloor = { height: head, at: now };
      return until;
    }
    transaction(txId) { return this._call('get_transaction', core.transaction_body(txId)); }
    block(height) { return this._call('get_block', core.block_by_height_body(BigInt(height))); }
    submit(txHex) { return this._call('submit_transaction', core.submit_body(txHex)); }
    container(address) { return this._call('get_container', JSON.stringify({ address })); }
    storage(address) { return this._call('get_storage', JSON.stringify({ address })); }
    events(height) { return this._call('get_events', core.eventsBody(BigInt(height))); }

    address(seedHex, index) { return core.address(seedHex, accountIndex(index)); }

    async transfer(seedHex, index, to, amount, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(to)) throw new Error('the recipient is not a q1 address');
      checkAmount(amount);
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const reported = info && info.fee && info.fee.transfer_quon;
      if (reported == null) throw new Error('the gateway did not report a transfer fee');
      const fee = gatewayFee(reported);
      if (fee > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const nonce = this._checkedNonce(acct.nonce, expectedNonce, from);
      const signed = JSON.parse(
        core.sign_transfer(seedHex, accountIndex(index), to, String(amount), nonce, String(fee), chainId, until)
      );
      this._guardSigned(from, nonce, signed.tx_hex, until, expectedNonce != null);
      const outcome = await this.submit(signed.tx_hex);
      this._remember(from, nonce, outcome);
      return { signed, outcome };
    }

    async register(seedHex, index, maxFeeQuon, expectedNonce) {
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const reported = info && info.fee && info.fee.transfer_quon;
      if (reported == null) throw new Error('the gateway did not report a transfer fee');
      const fee = gatewayFee(reported);
      if (fee > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const nonce = this._checkedNonce(acct.nonce, expectedNonce, from);
      const signed = JSON.parse(core.signRegister(seedHex, accountIndex(index), nonce, String(fee), chainId, until));
      this._guardSigned(from, nonce, signed.tx_hex, until, expectedNonce != null);
      const outcome = await this.submit(signed.tx_hex);
      this._remember(from, nonce, outcome);
      return { signed, outcome };
    }

    async call(seedHex, index, target, argsHex, meterLimit, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const reported = info && info.fee && info.fee.transfer_quon;
      if (reported == null) throw new Error('the gateway did not report a transfer fee');
      const transferFee = gatewayFee(reported);
      const fee = BigInt(core.vmCallFee(String(transferFee), meterLimitOf(meterLimit)));
      if (fee > ceiling) {
        throw new Error(`the fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const nonce = this._checkedNonce(acct.nonce, expectedNonce, from);
      const signed = JSON.parse(
        core.sign_call(seedHex, accountIndex(index), target, argsHex, nonce, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee))
      );
      this._guardSigned(from, nonce, signed.tx_hex, until, expectedNonce != null);
      const outcome = await this.submit(signed.tx_hex);
      this._remember(from, nonce, outcome);
      return { signed, outcome };
    }

    async assetCall(seedHex, index, target, argsHex, assetIssuer, amount, meterLimit, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      if (!core.valid_address(assetIssuer)) throw new Error('the asset issuer is not a q1 address');
      checkAmount(amount);
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const reported = info && info.fee && info.fee.transfer_quon;
      if (reported == null) throw new Error('the gateway did not report a transfer fee');
      const transferFee = gatewayFee(reported);
      const fee = BigInt(core.vmCallFee(String(transferFee), meterLimitOf(meterLimit)));
      if (fee > ceiling) {
        throw new Error(`the fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const nonce = this._checkedNonce(acct.nonce, expectedNonce, from);
      const signed = JSON.parse(
        core.signAssetCall(seedHex, accountIndex(index), target, argsHex, assetIssuer, String(amount), nonce, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee))
      );
      this._guardSigned(from, nonce, signed.tx_hex, until, expectedNonce != null);
      const outcome = await this.submit(signed.tx_hex);
      this._remember(from, nonce, outcome);
      return { signed, outcome };
    }

    async payableCall(seedHex, index, target, argsHex, value, meterLimit, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      checkAmount(value);
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const reported = info && info.fee && info.fee.transfer_quon;
      if (reported == null) throw new Error('the gateway did not report a transfer fee');
      const transferFee = gatewayFee(reported);
      const fee = BigInt(core.vmCallFee(String(transferFee), meterLimitOf(meterLimit)));
      if (fee > ceiling) {
        throw new Error(`the fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const nonce = this._checkedNonce(acct.nonce, expectedNonce, from);
      const signed = JSON.parse(
        core.signPayableCall(seedHex, accountIndex(index), target, argsHex, nonce, meterLimitOf(meterLimit), String(fee), String(value), chainId, until, String(transferFee))
      );
      this._guardSigned(from, nonce, signed.tx_hex, until, expectedNonce != null);
      const outcome = await this.submit(signed.tx_hex);
      this._remember(from, nonce, outcome);
      return { signed, outcome };
    }

    async _slotValue(contract, key) {
      const resp = await this._call('get_storage_at', JSON.stringify({ address: contract, keys: [key] }));
      return BigInt(core.storageValue(JSON.stringify(resp), key));
    }

    async contractNonce(contract, signerHex) {
      return this._slotValue(contract, core.nonceSlotKey(signerHex));
    }

    async contractScalar(contract, slot) {
      return this._slotValue(contract, core.scalarSlotKey(BigInt(slot)));
    }

    async callSignedOrder(callerSeedHex, callerIndex, contract, selectorHex, orderSpec, ownerSeedHex, ownerIndex, meterLimit, maxFeeQuon, expectedOrderNonce, expectedNonce) {
      if (!core.valid_address(contract)) throw new Error('the contract is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const reported = info && info.fee && info.fee.transfer_quon;
      if (reported == null) throw new Error('the gateway did not report a transfer fee');
      const transferFee = gatewayFee(reported);
      const fee = BigInt(core.vmCallFee(String(transferFee), meterLimitOf(meterLimit)));
      if (fee > ceiling) {
        throw new Error(`the fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const signer = core.orderSigner(ownerSeedHex, accountIndex(ownerIndex));
      const orderKey = contract + '/' + signer;
      const reportedOrder = await this.contractNonce(contract, signer);
      if (expectedOrderNonce != null && BigInt(expectedOrderNonce) !== reportedOrder) {
        throw new Error(
          `the gateway reported order nonce ${reportedOrder} but you expected ${expectedOrderNonce}, refusing to sign`
        );
      }
      const nonce = this._checkedNonce(reportedOrder, expectedOrderNonce, orderKey);
      const order = JSON.parse(core.buildTypedOrderCall(
        chainId,
        contract,
        selectorHex,
        BigInt(orderSpec.schemeOff),
        BigInt(orderSpec.ptrOff),
        BigInt(orderSpec.regionOff || 0),
        JSON.stringify(orderSpec.fields || [], (k, v) => {
          if (typeof v !== 'bigint') return v;
          if (k === 'value') return v.toString();
          if (v > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`the order field ${k} ${v} is too large to carry`);
          return Number(v);
        }),
        ownerSeedHex,
        accountIndex(ownerIndex),
        nonce,
      ));
      const from = core.address(callerSeedHex, accountIndex(callerIndex));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const accountNonceUsed = this._checkedNonce(acct.nonce, expectedNonce, from);
      const signed = JSON.parse(
        core.sign_call(callerSeedHex, accountIndex(callerIndex), contract, order.call_args, accountNonceUsed, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee))
      );
      this._guardSigned(from, accountNonceUsed, signed.tx_hex, until, expectedNonce != null);
      const outcome = await this.submit(signed.tx_hex);
      this._remember(from, accountNonceUsed, outcome);
      this._remember(orderKey, nonce, outcome);
      return { order, signed, outcome, orderNonce: nonce };
    }
  };
}

export { makeClient, wrapCore, feeCeiling, checkAmount, generateSeed, readBounded, requireSafeTransport, validUntil, VALIDITY_BLOCKS, Network };
