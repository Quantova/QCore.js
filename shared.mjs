// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const MAX_RESPONSE = 8 * 1024 * 1024;
const TIMEOUT_MS = 20000;

function feeCeiling(maxFeeQuon) {
  if (typeof maxFeeQuon === 'number') {
    throw new Error('pass the maximum fee as a decimal string or a BigInt, never a JavaScript number, because a number silently rounds above 2^53 and could set the ceiling higher than you intended');
  }
  return wholeNumber(maxFeeQuon, 'maximum fee', U128_MAX);
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
  return wholeNumber(index, 'account index', U64_MAX);
}

function accountNonce(nonce) {
  return wholeNumber(nonce, 'nonce', U64_MAX);
}

const VALIDITY_BLOCKS = 300n;
const MAX_PLAUSIBLE_HEAD = 1n << 40n;
const U64_MAX = 0xffffffffffffffffn;
const U128_MAX = (1n << 128n) - 1n;

function monotonicSecs() {
  const clock = globalThis.performance;
  const ms = clock && typeof clock.now === 'function' ? clock.now() : Date.now();
  return BigInt(Math.floor(ms / 1000));
}

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

const ACCOUNT_LOCKS = new Map();

function requireVerifiedTls() {
  const env = typeof process !== 'undefined' && process && process.env ? process.env : null;
  if (env && env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error('this process has TLS certificate checks turned off with NODE_TLS_REJECT_UNAUTHORIZED=0, refusing to talk to a gateway');
  }
}

function shown(value) {
  const text = String(value).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, '');
  return text.length > 96 ? text.slice(0, 96) + '...' : text;
}

function coreArg(kind, label, value) {
  if (kind === 'text') {
    if (typeof value !== 'string') throw new Error(`the ${label} must be a string`);
    return value;
  }
  if (kind === 'phrase') {
    if (!(value instanceof Uint8Array)) throw new Error(`the ${label} must be a Uint8Array of UTF-8 text`);
    return value;
  }
  if (kind === 'seed') {
    if (!(value instanceof Uint8Array)) throw new Error(`the ${label} must be a Uint8Array of 32 bytes; pass a handle you can wipe after use, not a hex string`);
    if (value.length !== 32) throw new Error(`the ${label} must be 32 bytes`);
    return value;
  }
  if (kind === 'u64') return wholeNumber(value, label, U64_MAX);
  if (kind === 'u64opt') return value == null ? undefined : wholeNumber(value, label, U64_MAX);
  if (kind === 'u64s') return wholeNumber(value, label, U64_MAX).toString();
  if (kind === 'u128s') return wholeNumber(value, label, U128_MAX).toString();
  throw new Error(`unknown argument kind ${kind}`);
}

const CORE_ARGS = {
  address: [['seed', 'seed'], ['u64', 'account index']],
  mnemonicFromSeed: [['seed', 'seed']],
  mnemonicFromSeedText: [['seed', 'seed']],
  seedFromMnemonic: [['text', 'recovery phrase']],
  seedFromMnemonicBytes: [['phrase', 'recovery phrase']],
  genesisSecs: [['text', 'chain name']],
  headCeiling: [['text', 'chain name'], ['u64', 'wall clock seconds']],
  boundedValidUntil: [['text', 'chain name'], ['u64', 'head height'], ['u64', 'wall clock seconds'], ['u64opt', 'head floor'], ['u64', 'head floor age']],
  checkGatewayJson: [['text', 'gateway response']],
  orderSigner: [['seed', 'seed'], ['u64', 'account index']],
  sign_transfer: [['seed', 'seed'], ['u64', 'account index'], ['text', 'recipient'], ['u64s', 'amount'], ['u64', 'nonce'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline']],
  signRegister: [['seed', 'seed'], ['u64', 'account index'], ['u64', 'nonce'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline']],
  sign_call: [['seed', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee']],
  signPayableCall: [['seed', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64s', 'value'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee']],
  signAssetCall: [['seed', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['text', 'asset issuer'], ['u64s', 'amount'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee']],
  buildSignedOrderCall: [['u64', 'chain id'], ['text', 'contract'], ['text', 'selector'], ['text', 'layout hash'], ['u64', 'scheme offset'], ['u64', 'pointer offset'], ['u64', 'expiry offset'], ['text', 'field offsets'], ['text', 'fields'], ['u64', 'region offset'], ['seed', 'owner seed'], ['u64', 'owner index'], ['u64', 'order nonce'], ['u64', 'order expiry']],
  buildTypedOrderCall: [['u64', 'chain id'], ['text', 'contract'], ['text', 'selector'], ['text', 'layout hash'], ['u64', 'scheme offset'], ['u64', 'pointer offset'], ['u64', 'expiry offset'], ['u64', 'region offset'], ['text', 'fields'], ['seed', 'owner seed'], ['u64', 'owner index'], ['u64', 'order nonce'], ['u64', 'order expiry']],
  orderLayoutHash: [['text', 'selector'], ['text', 'order layout']],
  checkOrderExpiry: [['u64', 'order expiry'], ['u64', 'wall clock seconds']],
  storageValueReported: [['text', 'storage response'], ['text', 'slot key']],
  verifyFinality: [['u64', 'chain id'], ['text', 'header'], ['text', 'certificate'], ['text', 'validator roster']],
  verifyEvent: [['text', 'event root'], ['text', 'event leaf'], ['text', 'proof steps']],
  decodeEvent: [['text', 'event leaf']],
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
  const text = core.seedFromMnemonic;
  const bytes = core.seedFromMnemonicBytes;
  if (typeof text === 'function' && typeof bytes === 'function') {
    core.seedFromMnemonic = (phrase) => (phrase instanceof Uint8Array ? bytes(phrase) : text(phrase));
  }
  bindNetworkDefaults(raw);
  return Object.freeze(core);
}

const NETWORK_DEFAULTS = { testnetChainName: null, testnetRpcUrl: null };

function bindNetworkDefaults(core) {
  if (core && typeof core.testnetRpcUrl === 'function' && typeof core.testnetChainName === 'function') {
    NETWORK_DEFAULTS.testnetRpcUrl = core.testnetRpcUrl();
    NETWORK_DEFAULTS.testnetChainName = core.testnetChainName();
  }
}

function requireNetworkDefaults() {
  if (!NETWORK_DEFAULTS.testnetRpcUrl || !NETWORK_DEFAULTS.testnetChainName) {
    throw new Error('load the core before naming the testnet, its endpoint and chain come from the core');
  }
  return NETWORK_DEFAULTS;
}

function gatewayInteger(value, label) {
  if (value == null) throw new Error(`the gateway did not report a ${label}`);
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'bigint' && value >= 0n && value <= U64_MAX) return value;
  throw new Error(`the gateway reported a ${label} that is not a whole number`);
}

function gatewayDecimal(value, label) {
  if (value == null) throw new Error(`the gateway did not report a ${label}`);
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    throw new Error(`the gateway reported a ${label} that is not a string of decimal digits`);
  }
  const n = BigInt(value);
  if (n > U128_MAX) throw new Error(`the gateway reported a ${label} outside the unsigned 128 bit range`);
  return n;
}

function isMainnetChain(name) {
  return name.startsWith('Q-main-net-');
}

function isPublicChain(name) {
  return name.startsWith('Q-test-net-') || isMainnetChain(name);
}

function meterLimitOf(meterLimit) {
  return wholeNumber(meterLimit, 'meter limit', U64_MAX);
}

function validUntil(info) {
  const h = gatewayInteger(info && info.head_height, 'head height');
  if (h > MAX_PLAUSIBLE_HEAD) {
    throw new Error('the gateway reported a head height past any height this chain can have reached');
  }
  return h + VALIDITY_BLOCKS;
}

function gatewayFee(fee) {
  return gatewayDecimal(fee, 'transfer fee');
}

function decodeUtf8(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error('the response is not UTF-8');
  }
}

async function readBounded(res) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const header = res.headers.get('content-length');
    const len = header == null ? NaN : Number(header);
    if (!Number.isFinite(len) || len <= 0) {
      throw new Error('the response has no content-length to bound it and cannot be read safely');
    }
    if (len > MAX_RESPONSE) throw new Error('the response is too large');
    const whole = new Uint8Array(await res.arrayBuffer());
    if (whole.byteLength > MAX_RESPONSE) throw new Error('the response is too large');
    return decodeUtf8(whole);
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
  return decodeUtf8(merged);
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
    const defaults = requireNetworkDefaults();
    return new Network({
      name: 'testnet',
      chainId: defaults.testnetChainName,
      rpcUrl: defaults.testnetRpcUrl,
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
  return bytes;
}

function makeClient(core) {
  bindNetworkDefaults(core);
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
      const book = opts.addressBook == null ? [] : Array.from(opts.addressBook, String);
      this._session = new core.SigningSession(book);
      this._pinnedChainName = null;
      this._headFloor = null;
      if (opts.fetch != null && typeof opts.fetch !== 'function') throw new Error('the fetch option must be a function with the fetch signature');
      this._fetch = opts.fetch || ((url, init) => fetch(url, init));
      requireVerifiedTls();
      this._locks = ACCOUNT_LOCKS;
      for (const name of ['transfer', 'register', 'call', 'assetCall', 'payableCall']) {
        const inner = this[name].bind(this);
        this[name] = (seed, index, ...rest) => {
          let key;
          try { key = core.address(seed, index); } catch (e) { return inner(seed, index, ...rest); }
          return this._exclusive([key], () => inner(seed, index, ...rest));
        };
      }
      const order = this.callSignedOrder.bind(this);
      this.callSignedOrder = (callerSeed, callerIndex, contract, selectorHex, orderSpec, ownerSeed, ownerIndex, ...rest) => {
        const run = () => order(callerSeed, callerIndex, contract, selectorHex, orderSpec, ownerSeed, ownerIndex, ...rest);
        let keys;
        try {
          keys = [core.address(callerSeed, callerIndex), String(contract) + '/' + core.orderSigner(ownerSeed, ownerIndex)];
        } catch (e) {
          return run();
        }
        return this._exclusive(keys, run);
      };
    }

    _exclusive(keys, fn) {
      const prior = keys.map((key) => this._locks.get(key) || Promise.resolve());
      let release;
      const gate = new Promise((resolve) => { release = resolve; });
      for (const key of keys) this._locks.set(key, gate);
      return Promise.all(prior).then(fn).finally(() => {
        release();
        for (const key of keys) if (this._locks.get(key) === gate) this._locks.delete(key);
      });
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
          throw new Error(`the gateway reports chain ${shown(name)} but this client is configured for ${configured}; refusing to sign a transaction that would be valid on a network you did not choose`);
        }
      } else if (isPublicChain(name) && !(mainnet && this.acknowledgeMainnet)) {
        throw new Error(`the gateway reports the public chain ${shown(name)} but this client was opened for an unnamed network; configure the testnet or mainnet network before signing for it`);
      }
      if (mainnet && !this.acknowledgeMainnet) {
        throw new Error(`the gateway reports the mainnet chain ${shown(name)}; refusing to sign a mainnet transaction without acknowledgeMainnet`);
      }
      if (this._pinnedChainName === null) {
        this._pinnedChainName = name;
      } else if (this._pinnedChainName !== name) {
        throw new Error(`the gateway reported chain ${shown(this._pinnedChainName)} earlier and now reports ${shown(name)}; refusing to sign, the endpoint is not naming one network`);
      }
      return BigInt(core.chainIdFromName(name));
    }

    async _call(method, body, strict) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await this._fetch(this.base + '/v1/' + method, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body || '{}',
          signal: controller.signal,
          redirect: 'error',
        });
        const text = await readBounded(res);
        if (res.status === 200) core.checkGatewayJson(text);
        let data;
        try { data = JSON.parse(text); } catch { throw new Error('the node returned a non JSON response'); }
        if (res.status !== 200) {
          const detail = data && typeof data === 'object' ? (data.message || data.error) : null;
          throw new Error(detail ? shown(detail) : ('status ' + res.status));
        }
        return data;
      } finally {
        clearTimeout(timer);
      }
    }

    nodeInfo() { return this._call('node_info', '{}', true); }
    head() { return this._call('head', '{}'); }
    async account(address) {
      const acct = await this._call('get_account', core.account_body(address), true);
      if (!acct || typeof acct.address !== 'string') {
        throw new Error(`the gateway answered about ${address} without naming the account, refusing to trust it`);
      }
      if (acct.address !== address) {
        throw new Error(`the gateway answered for ${shown(acct.address)} when asked about ${address}, refusing to trust it`);
      }
      return acct;
    }

    _vet(sender, targets) {
      this._session.rememberAddress(sender);
      for (const target of targets) this._session.checkTarget(target);
    }

    _rememberTargets(targets) {
      for (const target of targets) this._session.rememberAddress(target);
    }

    _expected(value, label) {
      return value == null ? undefined : wholeNumber(value, label, U64_MAX);
    }

    async _accountSlot(from, expectedNonce) {
      const acct = await this.account(from);
      const reported = gatewayInteger(acct.nonce, 'nonce');
      this._session.releasePending(from);
      return BigInt(this._session.slot(from, reported, this._expected(expectedNonce, 'expected nonce'), false));
    }

    async _submitHeld(slots, txHex) {
      for (const [key, slot] of slots) this._session.signed(key, slot);
      const outcome = await this.submit(txHex);
      const verdict = outcome && outcome.verdict;
      if (verdict !== 'accepted' && verdict !== 'rejected') throw new Error(`unknown verdict ${shown(verdict)}`);
      for (const [key, slot] of slots) this._session.outcome(key, slot, verdict === 'accepted');
      return outcome;
    }

    _transferFee(info) {
      return gatewayFee(info && info.fee && info.fee.transfer_quon);
    }

    _validity(info) {
      const head = gatewayInteger(info && info.head_height, 'head height');
      const chain = info && typeof info.chain_id === 'string' ? info.chain_id : '';
      const wall = BigInt(Math.floor(Date.now() / 1000));
      const tick = monotonicSecs();
      const floor = this._headFloor;
      const age = floor && tick > floor.at ? tick - floor.at : 0n;
      const until = BigInt(core.boundedValidUntil(chain, head, wall, floor ? floor.height : undefined, age));
      if (!floor || head > floor.height) this._headFloor = { height: head, at: tick };
      return until;
    }

    _callFee(info, meterLimit, ceiling, maxFeeQuon) {
      const transferFee = this._transferFee(info);
      const fee = BigInt(core.vmCallFee(String(transferFee), meterLimitOf(meterLimit)));
      if (fee > ceiling) {
        throw new Error(`the fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      return { transferFee, fee };
    }

    transaction(txId) { return this._call('get_transaction', core.transaction_body(txId)); }
    block(height) { return this._call('get_block', core.block_by_height_body(wholeNumber(height, 'height', U64_MAX))); }
    submit(txHex) { return this._call('submit_transaction', core.submit_body(txHex), true); }
    container(address) { return this._call('get_container', JSON.stringify({ address })); }
    storage(address) { return this._call('get_storage', JSON.stringify({ address })); }
    events(height) { return this._call('get_events', core.eventsBody(wholeNumber(height, 'height', U64_MAX))); }

    address(seed, index) { return core.address(seed, accountIndex(index)); }

    async transfer(seed, index, to, amount, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(to)) throw new Error('the recipient is not a q1 address');
      checkAmount(amount);
      const ceiling = feeCeiling(maxFeeQuon);
      const from = core.address(seed, accountIndex(index));
      this._vet(from, [to]);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = this._transferFee(info);
      if (fee > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.sign_transfer(seed, accountIndex(index), to, String(amount), nonce, String(fee), chainId, until)
      );
      this._rememberTargets([to]);
      const outcome = await this._submitHeld([[from, nonce]], signed.tx_hex);
      return { signed, outcome };
    }

    async register(seed, index, maxFeeQuon, expectedNonce) {
      const ceiling = feeCeiling(maxFeeQuon);
      const from = core.address(seed, accountIndex(index));
      this._vet(from, []);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = this._transferFee(info);
      if (fee > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const until = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(core.signRegister(seed, accountIndex(index), nonce, String(fee), chainId, until));
      const outcome = await this._submitHeld([[from, nonce]], signed.tx_hex);
      return { signed, outcome };
    }

    async call(seed, index, target, argsHex, meterLimit, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const from = core.address(seed, accountIndex(index));
      this._vet(from, [target]);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const { transferFee, fee } = this._callFee(info, meterLimit, ceiling, maxFeeQuon);
      const until = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.sign_call(seed, accountIndex(index), target, argsHex, nonce, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee))
      );
      this._rememberTargets([target]);
      const outcome = await this._submitHeld([[from, nonce]], signed.tx_hex);
      return { signed, outcome };
    }

    async assetCall(seed, index, target, argsHex, assetIssuer, amount, meterLimit, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      if (!core.valid_address(assetIssuer)) throw new Error('the asset issuer is not a q1 address');
      checkAmount(amount);
      const ceiling = feeCeiling(maxFeeQuon);
      const from = core.address(seed, accountIndex(index));
      this._vet(from, [target, assetIssuer]);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const { transferFee, fee } = this._callFee(info, meterLimit, ceiling, maxFeeQuon);
      const until = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.signAssetCall(seed, accountIndex(index), target, argsHex, assetIssuer, String(amount), nonce, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee))
      );
      this._rememberTargets([target, assetIssuer]);
      const outcome = await this._submitHeld([[from, nonce]], signed.tx_hex);
      return { signed, outcome };
    }

    async payableCall(seed, index, target, argsHex, value, meterLimit, maxFeeQuon, expectedNonce) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      checkAmount(value);
      const ceiling = feeCeiling(maxFeeQuon);
      const from = core.address(seed, accountIndex(index));
      this._vet(from, [target]);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const { transferFee, fee } = this._callFee(info, meterLimit, ceiling, maxFeeQuon);
      const until = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.signPayableCall(seed, accountIndex(index), target, argsHex, nonce, meterLimitOf(meterLimit), String(fee), String(value), chainId, until, String(transferFee))
      );
      this._rememberTargets([target]);
      const outcome = await this._submitHeld([[from, nonce]], signed.tx_hex);
      return { signed, outcome };
    }

    async _slotValue(contract, key) {
      const resp = await this._call('get_storage_at', JSON.stringify({ address: contract, keys: [key] }), true);
      const value = core.storageValueReported(JSON.stringify(resp), key);
      if (value == null) throw new Error('the gateway did not report the requested storage slot');
      return BigInt(value);
    }

    async contractNonce(contract, signerHex) {
      return this._slotValue(contract, core.nonceSlotKey(signerHex));
    }

    async contractScalar(contract, slot) {
      return this._slotValue(contract, core.scalarSlotKey(wholeNumber(slot, 'slot', U64_MAX)));
    }

    async contractMap(contract, mapDomainTag, keyHex) {
      return this._slotValue(contract, core.mapSlotKey(wholeNumber(mapDomainTag, 'map domain tag', U64_MAX), keyHex));
    }

    async assetBalance(issuer, holder) {
      if (!core.valid_address(issuer) || !core.valid_address(holder)) {
        throw new Error('the issuer or holder is not a q1 address');
      }
      const resp = await this._call('get_asset_balance', core.assetBalanceBody(issuer, holder), true);
      return gatewayDecimal(resp && resp.balance, 'balance');
    }

    async callSignedOrder(callerSeed, callerIndex, contract, selectorHex, orderSpec, ownerSeed, ownerIndex, meterLimit, maxFeeQuon, expectedOrderNonce, expectedNonce) {
      if (!core.valid_address(contract)) throw new Error('the contract is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const from = core.address(callerSeed, accountIndex(callerIndex));
      this._vet(from, [contract]);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const { transferFee, fee } = this._callFee(info, meterLimit, ceiling, maxFeeQuon);
      const until = this._validity(info);
      const signer = core.orderSigner(ownerSeed, accountIndex(ownerIndex));
      const orderKey = contract + '/' + signer;
      const reportedOrder = await this.contractNonce(contract, signer);
      this._session.releasePending(orderKey);
      const nonce = BigInt(this._session.slot(orderKey, reportedOrder, this._expected(expectedOrderNonce, 'expected order nonce'), true));
      if (typeof orderSpec.layoutHash !== 'string') throw new Error('the order spec needs the layout hash the compiler emits for this entry');
      const orderExpiry = wholeNumber(orderSpec.expiry, 'order expiry', U64_MAX);
      const nowSecs = BigInt(Math.floor(Date.now() / 1000));
      core.checkOrderExpiry(orderExpiry, nowSecs);
      const order = JSON.parse(core.buildTypedOrderCall(
        chainId,
        contract,
        selectorHex,
        orderSpec.layoutHash,
        wholeNumber(orderSpec.schemeOff, 'scheme offset', U64_MAX),
        wholeNumber(orderSpec.ptrOff, 'pointer offset', U64_MAX),
        wholeNumber(orderSpec.expiryOff, 'expiry offset', U64_MAX),
        orderSpec.regionOff == null ? 0n : wholeNumber(orderSpec.regionOff, 'region offset', U64_MAX),
        JSON.stringify(orderSpec.fields || [], (k, v) => {
          if (typeof v !== 'bigint') return v;
          if (k === 'value') return v.toString();
          if (v > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`the order field ${k} ${v} is too large to carry`);
          return Number(v);
        }),
        ownerSeed,
        accountIndex(ownerIndex),
        nonce,
        wholeNumber(orderSpec.expiry, 'order expiry', U64_MAX),
      ));
      const accountNonceUsed = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.sign_call(callerSeed, accountIndex(callerIndex), contract, order.call_args, accountNonceUsed, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee))
      );
      this._rememberTargets([contract]);
      const outcome = await this._submitHeld([[orderKey, nonce], [from, accountNonceUsed]], signed.tx_hex);
      return { order, signed, outcome, orderNonce: nonce };
    }
  };
}

export { makeClient, wrapCore, feeCeiling, checkAmount, generateSeed, readBounded, requireSafeTransport, validUntil, VALIDITY_BLOCKS, Network };
