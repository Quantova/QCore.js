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
      chainId: 'Q-test-net-1',
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

function chainIdLooksLikeMainnet(chainId) {
  if (!chainId) return false;
  return !/test|dev|local/i.test(String(chainId));
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

    _guardMainnet(chainId) {
      const onMainnet = (this.network && this.network.isMainnet) || chainIdLooksLikeMainnet(chainId);
      if (onMainnet && !this.acknowledgeMainnet) {
        throw new Error(`refusing to sign for the mainnet chain ${chainId || this.network.chainId} without acknowledgeMainnet true, pass it when you mean to move real value`);
      }
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
        });
        const text = await readBounded(res);
        let data;
        try { data = JSON.parse(text); } catch { throw new Error('the node returned a non JSON response'); }
        if (!res.ok) throw new Error(data.message || data.error || ('status ' + res.status));
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
    events(height) { return this._call('get_events', JSON.stringify({ height: Number(BigInt(height)) })); }

    address(seedHex, index) { return core.address(seedHex, BigInt(index)); }

    async transfer(seedHex, index, to, amount, maxFeeQuon) {
      if (!core.valid_address(to)) throw new Error('the recipient is not a q1 address');
      checkAmount(amount);
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet(info && info.chain_id);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (BigInt(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, BigInt(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.sign_transfer(seedHex, BigInt(index), to, String(amount), BigInt(acct.nonce), String(fee))
      );
      const outcome = await this.submit(signed.tx_hex);
      return { signed, outcome };
    }

    async register(seedHex, index, maxFeeQuon) {
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet(info && info.chain_id);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (BigInt(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, BigInt(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(core.signRegister(seedHex, BigInt(index), BigInt(acct.nonce), String(fee)));
      const outcome = await this.submit(signed.tx_hex);
      return { signed, outcome };
    }

    async call(seedHex, index, target, argsHex, meterLimit, maxFeeQuon) {
      if (!core.valid_address(target)) throw new Error('the target is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const info = await this.nodeInfo();
      this._guardMainnet(info && info.chain_id);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (BigInt(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(seedHex, BigInt(index));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.sign_call(seedHex, BigInt(index), target, argsHex, BigInt(acct.nonce), BigInt(meterLimit), String(fee))
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

    async callSignedOrder(callerSeedHex, callerIndex, contract, selectorHex, layout, fields, ownerSeedHex, ownerIndex, meterLimit, maxFeeQuon) {
      if (!core.valid_address(contract)) throw new Error('the contract is not a q1 address');
      const ceiling = feeCeiling(maxFeeQuon);
      const signer = core.orderSigner(ownerSeedHex, BigInt(ownerIndex));
      const nonce = await this.contractNonce(contract, signer);
      const order = JSON.parse(core.buildSignedOrderCall(
        contract,
        selectorHex,
        BigInt(layout.schemeOff),
        BigInt(layout.ptrOff),
        (layout.fieldOffs || []).join(','),
        (fields || []).map(String).join(','),
        BigInt(layout.regionOff || 0),
        ownerSeedHex,
        BigInt(ownerIndex),
        nonce,
      ));
      const info = await this.nodeInfo();
      this._guardMainnet(info && info.chain_id);
      const fee = info && info.fee && info.fee.transfer_quon;
      if (fee == null) throw new Error('the gateway did not report a transfer fee');
      if (BigInt(fee) > ceiling) {
        throw new Error(`the gateway fee ${fee} is above the maximum you allowed ${maxFeeQuon}, refusing to sign`);
      }
      const from = core.address(callerSeedHex, BigInt(callerIndex));
      const acct = await this.account(from);
      if (!acct || acct.nonce == null) throw new Error('the gateway did not report a nonce');
      const signed = JSON.parse(
        core.sign_call(callerSeedHex, BigInt(callerIndex), contract, order.call_args, BigInt(acct.nonce), BigInt(meterLimit), String(fee))
      );
      const outcome = await this.submit(signed.tx_hex);
      return { order, signed, outcome };
    }
  };
}

module.exports = { makeClient, feeCeiling, checkAmount, generateSeed, readBounded, requireSafeTransport, Network };
