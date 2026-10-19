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
  const chars = Array.from(String(value).replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, ''));
  return chars.length > 96 ? chars.slice(0, 96).join('') + '...' : chars.join('');
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
  sign_transfer: [['seed', 'seed'], ['u64', 'account index'], ['text', 'recipient'], ['u64s', 'amount'], ['u64', 'nonce'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u64', 'head height'], ['text', 'genesis hash']],
  signRegister: [['seed', 'seed'], ['u64', 'account index'], ['u64', 'nonce'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u64', 'head height'], ['text', 'genesis hash']],
  sign_call: [['seed', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee'], ['u64', 'head height'], ['text', 'genesis hash']],
  signPayableCall: [['seed', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64s', 'value'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee'], ['u64', 'head height'], ['text', 'genesis hash']],
  signAssetCall: [['seed', 'seed'], ['u64', 'account index'], ['text', 'target'], ['text', 'call arguments'], ['text', 'asset issuer'], ['u64s', 'amount'], ['u64', 'nonce'], ['u64', 'meter limit'], ['u128s', 'fee'], ['u64', 'chain id'], ['u64', 'validity deadline'], ['u128s', 'transfer fee'], ['u64', 'head height'], ['text', 'genesis hash']],
  buildSignedOrderCall: [['u64', 'chain id'], ['text', 'contract'], ['text', 'selector'], ['text', 'layout hash'], ['u64', 'scheme offset'], ['u64', 'pointer offset'], ['u64', 'expiry offset'], ['text', 'field offsets'], ['text', 'fields'], ['u64', 'region offset'], ['seed', 'owner seed'], ['u64', 'owner index'], ['u64', 'order nonce'], ['u64', 'order expiry']],
  buildTypedOrderCall: [['u64', 'chain id'], ['text', 'contract'], ['text', 'selector'], ['text', 'layout hash'], ['u64', 'scheme offset'], ['u64', 'pointer offset'], ['u64', 'expiry offset'], ['u64', 'region offset'], ['text', 'fields'], ['seed', 'owner seed'], ['u64', 'owner index'], ['u64', 'order nonce'], ['u64', 'order expiry']],
  orderLayoutHash: [['text', 'selector'], ['text', 'order layout']],
  checkOrderExpiry: [['u64', 'order expiry'], ['u64', 'wall clock seconds']],
  storageValueReported: [['text', 'storage response'], ['text', 'slot key']],
  verifyFinality: [['u64', 'chain id'], ['text', 'genesis hash'], ['text', 'header'], ['text', 'certificate'], ['text', 'validator roster']],
  rosterCommitment: [['u64', 'roster epoch'], ['text', 'validator roster']],
  verifyNextRoster: [['u64', 'chain id'], ['text', 'genesis hash'], ['u64', 'roster epoch'], ['text', 'validator roster'], ['text', 'header'], ['text', 'certificate'], ['text', 'next validator roster'], ['text', 'roster proof']],
  verifyAccount: [['u64', 'chain id'], ['text', 'genesis hash'], ['u64', 'roster epoch'], ['text', 'validator roster'], ['text', 'address'], ['text', 'header'], ['text', 'certificate'], ['text', 'account proof']],
  verifyEvent: [['text', 'event root'], ['text', 'event leaf'], ['text', 'proof steps']],
  verifyTransaction: [['text', 'transaction root'], ['text', 'transaction id'], ['text', 'transaction leaf'], ['text', 'proof steps']],
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
  if (core && typeof core.testnetGenesisHash === 'function') NETWORK_DEFAULTS.testnetGenesisHash = core.testnetGenesisHash() || null;
  if (core && typeof core.mainnetGenesisHash === 'function') NETWORK_DEFAULTS.mainnetGenesisHash = core.mainnetGenesisHash() || null;
  if (core && typeof core.testnetRosterCommitment === 'function') NETWORK_DEFAULTS.testnetRosterCommitment = core.testnetRosterCommitment() || null;
  if (core && typeof core.mainnetRosterCommitment === 'function') NETWORK_DEFAULTS.mainnetRosterCommitment = core.mainnetRosterCommitment() || null;
}

function pinnedGenesis(value) {
  if (value == null) return null;
  if (typeof value !== 'string' || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('a pinned genesis hash must be 64 hex characters');
  }
  return value.toLowerCase();
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
    this.genesisHash = pinnedGenesis(fields.genesisHash);
    this.rosterCommitment = pinnedGenesis(fields.rosterCommitment);
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
      genesisHash: defaults.testnetGenesisHash || null,
      rosterCommitment: defaults.testnetRosterCommitment || null,
    });
  }

  static mainnet() {
    return new Network({
      name: 'mainnet',
      chainId: 'Q-main-net-1',
      rpcUrl: null,
      explorerUrl: 'https://qvmscan.io',
      isMainnet: true,
      genesisHash: NETWORK_DEFAULTS.mainnetGenesisHash || null,
      rosterCommitment: NETWORK_DEFAULTS.mainnetRosterCommitment || null,
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
      const networkGenesis = this.network ? this.network.genesisHash : null;
      const optionGenesis = pinnedGenesis(opts.genesisHash);
      if (networkGenesis && optionGenesis && networkGenesis !== optionGenesis) {
        throw new Error('the genesisHash option differs from the genesis pinned in the network, refusing to open the client');
      }
      this._pinnedGenesis = networkGenesis || optionGenesis;
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
        requireVerifiedTls();
        const aborted = new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('the gateway did not answer in time')), { once: true });
        });
        const res = await Promise.race([this._fetch(this.base + '/v1/' + method, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body || '{}',
          signal: controller.signal,
          redirect: 'error',
        }), aborted]);
        const text = await Promise.race([readBounded(res), aborted]);
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

    async nodeInfo() {
      const info = await this._call('node_info', '{}', true);
      const supported = core.gatewayProtocol();
      const reported = info && info.protocol;
      if (reported === undefined || reported === null) throw new Error('the gateway does not report its protocol version, refusing to use it');
      if (reported !== supported) throw new Error(`the gateway speaks protocol ${shown(reported)} but this client supports protocol ${supported}, refusing to use it`);
      return info;
    }
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

    trustRoster(genesisHash, roster) {
      this.trustRosterAt(genesisHash, 0, roster);
    }

    trustRosterAt(genesisHash, epoch, roster) {
      if (typeof genesisHash !== 'string' || !/^[0-9a-fA-F]{64}$/.test(genesisHash)) {
        throw new Error('the genesis hash you trust must be 64 hex characters');
      }
      const json = typeof roster === 'string' ? roster : JSON.stringify(roster);
      let members;
      try {
        members = JSON.parse(json);
      } catch (e) {
        throw new Error('the trusted validator roster is not valid JSON');
      }
      if (!Array.isArray(members) || members.length === 0) {
        throw new Error('a trusted validator roster must be a non empty array');
      }
      this._trustedRosters = new Map([[BigInt(wholeNumber(epoch, 'roster epoch', U64_MAX)), json]]);
      this._trustedGenesis = genesisHash.toLowerCase();
    }

    async _anchorPinnedRoster() {
      if (this._trustedRosters instanceof Map) return true;
      const network = this.network;
      if (!network || !network.genesisHash || !network.rosterCommitment) return false;
      const answer = await this._call('get_roster_proof', JSON.stringify({ epoch: 0 }), true);
      const members = JSON.stringify(answer && answer.members);
      if (core.rosterCommitment(0n, members) !== network.rosterCommitment) {
        throw new Error('the gateway offers a genesis roster other than the one pinned for this network, refusing to trust it');
      }
      this.trustRosterAt(network.genesisHash, 0, members);
      return true;
    }

    async _rosterForEpoch(chainId, epoch) {
      if (!(await this._anchorPinnedRoster())) return null;
      const target = BigInt(epoch);
      let start = null;
      for (const known of this._trustedRosters.keys()) {
        if (known <= target && (start === null || known > start)) start = known;
      }
      if (start === null) throw new Error(`the trusted roster starts after epoch ${target}, so that epoch cannot be checked`);
      let current = start;
      let roster = this._trustedRosters.get(start);
      while (current < target) {
        const next = current + 1n;
        const answer = await this._call('get_roster_proof', JSON.stringify({ epoch: Number(next) }), true);
        if (!answer || typeof answer.header_bytes !== 'string' || typeof answer.certificate !== 'string' || typeof answer.proof !== 'string') {
          throw new Error(`the gateway gave no roster proof for epoch ${next}`);
        }
        const members = JSON.stringify(answer.members);
        core.verifyNextRoster(chainId, this._trustedGenesis, current, roster, answer.header_bytes, answer.certificate, members, answer.proof);
        current = next;
        roster = members;
        this._trustedRosters.set(current, roster);
        while (this._trustedRosters.size > 32) {
          const keys = [...this._trustedRosters.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
          this._trustedRosters.delete(keys[1]);
        }
      }
      return roster;
    }

    async _certifiedAt(height) {
      const finality = await this._call('get_finality', JSON.stringify({ height: Number(height) }), true);
      if (!finality || typeof finality.header_bytes !== 'string' || typeof finality.certificate !== 'string') {
        throw new Error(`the gateway gave no finality proof for height ${height}`);
      }
      return { epoch: gatewayInteger(finality.epoch, 'finality epoch'), header: finality.header_bytes, certificate: finality.certificate };
    }

    async _verifyHead(info) {
      if (!(await this._anchorPinnedRoster())) {
        const reported = info && typeof info.chain_id === 'string' ? info.chain_id : '';
        const configured = (this.network && this.network.chainId) || this.expectedChainId || '';
        if ((this.network && this.network.isMainnet === true) || isMainnetChain(reported) || isMainnetChain(configured)) {
          throw new Error('a mainnet client needs a trusted validator roster to check the head it signs against, call trustRoster first');
        }
        return;
      }
      const head = gatewayInteger(info && info.head_height, 'head height');
      const name = info && typeof info.chain_id === 'string' ? info.chain_id : '';
      const chainId = BigInt(core.chainIdFromName(name));
      const certified = await this._certifiedAt(head);
      const roster = await this._rosterForEpoch(chainId, certified.epoch);
      const verified = JSON.parse(core.verifyFinality(chainId, this._trustedGenesis, certified.header, certified.certificate, roster));
      if (BigInt(verified.height) !== head) {
        throw new Error(`the gateway reports head ${head} but its finality proof is for height ${verified.height}, refusing to sign`);
      }
    }

    async verifiedAccount(address) {
      if (typeof address !== 'string') throw new Error('the address must be a string');
      const info = await this.nodeInfo();
      const name = info && typeof info.chain_id === 'string' ? info.chain_id : '';
      const chainId = BigInt(core.chainIdFromName(name));
      const answer = await this._call('get_account_proof', JSON.stringify({ address }), true);
      if (!answer || typeof answer.header_bytes !== 'string' || typeof answer.certificate !== 'string' || typeof answer.proof !== 'string') {
        throw new Error('the gateway gave no account proof');
      }
      const epoch = gatewayInteger(answer.epoch, 'account proof epoch');
      const roster = await this._rosterForEpoch(chainId, epoch);
      if (roster === null) throw new Error('a verified balance needs a trusted validator roster, call trustRoster first');
      const verified = JSON.parse(core.verifyAccount(chainId, this._trustedGenesis, epoch, roster, address, answer.header_bytes, answer.certificate, answer.proof));
      return { address: verified.address, height: BigInt(verified.height), exists: verified.exists === true, balance: BigInt(verified.balance), nonce: BigInt(verified.nonce) };
    }

    async confirmTransactionTrusted(txId) {
      if (typeof txId !== 'string') throw new Error('the transaction id must be a string');
      const status = await this._call('get_transaction', core.transaction_body(txId));
      if (!status || status.status !== 'finalised') throw new Error('the transaction is not reported as finalised');
      const height = gatewayInteger(status.height, 'transaction height');
      const info = await this.nodeInfo();
      const name = info && typeof info.chain_id === 'string' ? info.chain_id : '';
      const chainId = BigInt(core.chainIdFromName(name));
      const certified = await this._certifiedAt(height);
      const roster = await this._rosterForEpoch(chainId, certified.epoch);
      if (roster === null) throw new Error('a verified confirmation needs a trusted validator roster, call trustRoster first');
      return this.confirmTransaction(txId, this._trustedGenesis, roster);
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
      const genesis = info && typeof info.genesis_hash === 'string' ? info.genesis_hash : '';
      if (!/^[0-9a-fA-F]{64}$/.test(genesis)) {
        throw new Error('the gateway reports a genesis hash that is not 32 bytes of hex, refusing to sign');
      }
      const reported = genesis.toLowerCase();
      const name = info && typeof info.chain_id === 'string' ? info.chain_id : '';
      if (this._pinnedGenesis) {
        if (this._pinnedGenesis !== reported) {
          throw new Error('the gateway reports a genesis hash other than the one pinned for this network, refusing to sign');
        }
      } else if (isPublicChain(name)) {
        throw new Error(`no genesis hash is pinned for the public chain ${shown(name)}, pin the network genesis before signing`);
      }
      return { until, head, genesis: reported };
    }

    _callFee(info, meterLimit, ceiling, maxFeeQuon) {
      const transferFee = this._transferFee(info);
      const fee = BigInt(core.vmCallFee(String(transferFee), meterLimitOf(meterLimit)));
      if (fee > ceiling) {
        throw new Error(`the fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      return { transferFee, fee };
    }

    async transaction(txId) {
      const status = await this._call('get_transaction', core.transaction_body(txId));
      if (status && status.status === 'finalised' && (await this._anchorPinnedRoster())) {
        await this.confirmTransactionTrusted(txId);
      }
      return status;
    }

    saveSession() { return this._session.exportState(); }

    restoreSession(state) {
      if (typeof state !== 'string') throw new Error('the saved session must be the string saveSession returned');
      this._session.importState(state);
    }

    async confirmTransaction(txId, genesisHash, roster) {
      if (typeof txId !== 'string') throw new Error('the transaction id must be a string');
      if (typeof genesisHash !== 'string' || !/^[0-9a-fA-F]{64}$/.test(genesisHash)) {
        throw new Error('the genesis hash you trust must be 64 hex characters');
      }
      const rosterJson = typeof roster === 'string' ? roster : JSON.stringify(roster);
      const info = await this.nodeInfo();
      const name = info && typeof info.chain_id === 'string' ? info.chain_id : '';
      const configured = this.network && this.network.chainId;
      if (configured && name !== configured) {
        throw new Error(`the gateway reports chain ${shown(name)} but this client is configured for ${configured}`);
      }
      const chainId = BigInt(core.chainIdFromName(name));
      const proof = await this._call('get_transaction_proof', JSON.stringify({ tx_id: txId }), true);
      const height = gatewayInteger(proof && proof.height, 'proof height');
      const finality = await this._call('get_finality', JSON.stringify({ height: Number(height) }), true);
      const verified = JSON.parse(core.verifyFinality(chainId, genesisHash.toLowerCase(), String(finality.header_bytes), String(finality.certificate), rosterJson));
      if (BigInt(verified.height) !== height) throw new Error('the finalized header is not at the height the proof names');
      if (!core.verifyTransaction(verified.transaction_root, txId, String(proof.leaf), JSON.stringify(proof.steps))) {
        throw new Error('the transaction is not proven inside the finalized block');
      }
      return { txId, height, index: gatewayInteger(proof.index, 'proof index'), header: verified };
    }
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
      await this._verifyHead(info);
      const { until, head, genesis } = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.sign_transfer(seed, accountIndex(index), to, String(amount), nonce, String(fee), chainId, until, head, genesis)
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
      await this._verifyHead(info);
      const { until, head, genesis } = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(core.signRegister(seed, accountIndex(index), nonce, String(fee), chainId, until, head, genesis));
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
      await this._verifyHead(info);
      const { until, head, genesis } = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.sign_call(seed, accountIndex(index), target, argsHex, nonce, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee), head, genesis)
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
      await this._verifyHead(info);
      const { until, head, genesis } = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.signAssetCall(seed, accountIndex(index), target, argsHex, assetIssuer, String(amount), nonce, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee), head, genesis)
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
      await this._verifyHead(info);
      const { until, head, genesis } = this._validity(info);
      const nonce = await this._accountSlot(from, expectedNonce);
      const signed = JSON.parse(
        core.signPayableCall(seed, accountIndex(index), target, argsHex, nonce, meterLimitOf(meterLimit), String(fee), String(value), chainId, until, String(transferFee), head, genesis)
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
      await this._verifyHead(info);
      const { until, head, genesis } = this._validity(info);
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
        core.sign_call(callerSeed, accountIndex(callerIndex), contract, order.call_args, accountNonceUsed, meterLimitOf(meterLimit), String(fee), chainId, until, String(transferFee), head, genesis)
      );
      this._rememberTargets([contract]);
      const outcome = await this._submitHeld([[orderKey, nonce], [from, accountNonceUsed]], signed.tx_hex);
      return { order, signed, outcome, orderNonce: nonce };
    }
  };
}

module.exports = { makeClient, wrapCore, feeCeiling, checkAmount, generateSeed, readBounded, requireSafeTransport, validUntil, VALIDITY_BLOCKS, Network };
