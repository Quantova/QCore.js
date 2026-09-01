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
  const i = BigInt(index);
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
      try { await reader.cancel(); } catch { /* already closing */ }
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
      chainId: 'Q-test-net-2',
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
      const id = BigInt(core.chainIdFromName(name));
      const configured = this.network && this.network.chainId;
      if (configured && name !== configured) {
        throw new Error(`the gateway reports chain ${name} but this client is configured for ${configured}; refusing to sign a transaction that would be valid on a network you did not choose`);
      }
      if (!this.acknowledgeMainnet && this._isMainnetId(id)) {
        throw new Error(`the gateway reports the mainnet chain ${name}; refusing to sign a mainnet transaction without acknowledgeMainnet`);
      }
      return id;
    }

    _isMainnetId(id) {
      return id === BigInt(core.mainnetChainId());
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
    account(address) { return this._call('get_account', core.account_body(address)); }
    transaction(txId) { return this._call('get_transaction', core.transaction_body(txId)); }
    block(height) { return this._call('get_block', core.block_by_height_body(BigInt(height))); }
    submit(txHex) { return this._call('submit_transaction', core.submit_body(txHex)); }
    container(address) { return this._call('get_container', JSON.stringify({ address })); }
    storage(address) { return this._call('get_storage', JSON.stringify({ address })); }
    events(height) { return this._call('get_events', core.eventsBody(BigInt(height))); }

    address(seedHex, index) { return core.address(seedHex, accountIndex(index)); }

    async transfer(seedHex, index, to, amount, maxFeeQuon) {
      if (!core.valid_address(to)) throw new Error('the recipient is not a q1 address');
      checkAmount(amount);
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (gatewayFee(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.sign_transfer(seedHex, accountIndex(index), to, String(amount), accountNonce(acct.nonce), String(fee), chainId)
      );
      const outcome = await this.submit(signed.tx_hex);
      return { signed, outcome };
    }

    async register(seedHex, index, maxFeeQuon) {
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (gatewayFee(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(core.signRegister(seedHex, accountIndex(index), accountNonce(acct.nonce), String(fee), chainId));
      const outcome = await this.submit(signed.tx_hex);
      return { signed, outcome };
    }

    async call(seedHex, index, target, argsHex, meterLimit, maxFeeQuon) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (gatewayFee(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.sign_call(seedHex, accountIndex(index), target, argsHex, accountNonce(acct.nonce), BigInt(meterLimit), String(fee), chainId)
      );
      const outcome = await this.submit(signed.tx_hex);
      return { signed, outcome };
    }

    async assetCall(seedHex, index, target, argsHex, assetIssuer, amount, meterLimit, maxFeeQuon) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      if (!core.valid_address(assetIssuer)) throw new Error('the asset issuer is not a q1 address');
      checkAmount(amount);
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (gatewayFee(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.signAssetCall(seedHex, accountIndex(index), target, argsHex, assetIssuer, String(amount), accountNonce(acct.nonce), BigInt(meterLimit), String(fee), chainId)
      );
      const outcome = await this.submit(signed.tx_hex);
      return { signed, outcome };
    }

    async payableCall(seedHex, index, target, argsHex, value, meterLimit, maxFeeQuon) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      checkAmount(value);
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (gatewayFee(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, accountIndex(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.signPayableCall(seedHex, accountIndex(index), target, argsHex, accountNonce(acct.nonce), BigInt(meterLimit), String(fee), String(value), chainId)
      );
      const outcome = await this.submit(signed.tx_hex);
      return { signed, outcome };
    }

    async contractNonce(contract, signerHex) {
      const resp = await this._call('get_storage', core.storageBody(contract));
      return BigInt(core.storageValue(JSON.stringify(resp), core.nonceSlotKey(signerHex)));
    }

    async contractScalar(contract, slot) {
      const resp = await this._call('get_storage', core.storageBody(contract));
      return BigInt(core.storageValue(JSON.stringify(resp), core.scalarSlotKey(BigInt(slot))));
    }

    async callSignedOrder(callerSeedHex, callerIndex, contract, selectorHex, orderSpec, ownerSeedHex, ownerIndex, meterLimit, maxFeeQuon) {
      if (!core.valid_address(contract)) throw new Error('the contract is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet();
      const chainId = this._signingChainId(info);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (gatewayFee(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const signer = core.orderSigner(ownerSeedHex, accountIndex(ownerIndex));
      const nonce = await this.contractNonce(contract, signer);
      const order = JSON.parse(core.buildTypedOrderCall(
        chainId,
        contract,
        selectorHex,
        BigInt(orderSpec.schemeOff),
        BigInt(orderSpec.ptrOff),
        BigInt(orderSpec.regionOff || 0),
        JSON.stringify(orderSpec.fields || []),
        ownerSeedHex,
        accountIndex(ownerIndex),
        nonce,
      ));
      const from = core.address(callerSeedHex, accountIndex(callerIndex));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.sign_call(callerSeedHex, accountIndex(callerIndex), contract, order.call_args, accountNonce(acct.nonce), BigInt(meterLimit), String(fee), chainId)
      );
      const outcome = await this.submit(signed.tx_hex);
      return { order, signed, outcome };
    }
  };
}

module.exports = { makeClient, feeCeiling, checkAmount, generateSeed, readBounded, requireSafeTransport, Network };
