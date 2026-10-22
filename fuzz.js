// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { core } = require('./index.js');

const iterations = Number(process.argv[2] || 20000);
let state = BigInt(process.argv[3] || 1);

function next() {
  state = (state * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
  return Number(state >> 33n);
}

function pick(list) {
  return list[next() % list.length];
}

function bytes(max) {
  const out = new Uint8Array(next() % (max + 1));
  for (let i = 0; i < out.length; i++) out[i] = next() & 0xff;
  return out;
}

function hex(max) {
  return Buffer.from(bytes(max)).toString('hex');
}

function text(max) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789QTV_- {}[]:,."\\\u0000é​';
  let s = '';
  const n = next() % (max + 1);
  for (let i = 0; i < n; i++) s += alphabet[next() % alphabet.length];
  return s;
}

function json(depth) {
  const kind = next() % (depth > 3 ? 4 : 7);
  if (kind === 0) return next() % 2 === 0;
  if (kind === 1) return pick([0, 1, -1, 2 ** 53, 2 ** 64, 1.5, next()]);
  if (kind === 2) return pick([text(40), hex(64), '0x' + hex(32), 'QTV' + text(40)]);
  if (kind === 3) return null;
  if (kind === 4) return Array.from({ length: next() % 5 }, () => json(depth + 1));
  const keys = ['height', 'hash', 'events', 'root', 'value', 'proof', 'signatures', 'roster', 'chain_id', 'genesis_hash', 'status', 'tx_id', 'block', 'data', 'address', 'nonce', 'balance'];
  const out = {};
  for (let i = next() % 6; i > 0; i--) out[pick(keys)] = json(depth + 1);
  return out;
}

function input() {
  const kind = next() % 5;
  if (kind === 0) return text(120);
  if (kind === 1) return hex(256);
  if (kind === 2) return bytes(256);
  if (kind === 3) return JSON.stringify(json(0));
  return json(0);
}

const targets = [
  'decodeEvent', 'parseEvents', 'checkGatewayJson', 'valid_address', 'seedFromMnemonic',
  'seedFromMnemonicBytes', 'storageValue', 'storageValueReported', 'headerHeight', 'unpackSymbol',
  'verifyAccount', 'verifyEvent', 'verifyFinality', 'verifyFinalityInEpoch', 'verifyNextRoster',
  'verifyTransaction', 'transactionKind', 'sameAddress', 'lookalikeOf', 'checkEndpoint',
  'gatewayProtocol', 'orderSigner', 'chainIdFromName',
].filter((name) => typeof core[name] === 'function');

let crashes = 0;
for (let i = 0; i < iterations; i++) {
  const name = targets[i % targets.length];
  const args = Array.from({ length: 1 + (next() % 4) }, input);
  try {
    core[name](...args);
  } catch (err) {
    if (err instanceof WebAssembly.RuntimeError || /unreachable|panicked|RuntimeError/.test(String(err))) {
      crashes += 1;
      console.error('CRASH ' + name + ' ' + String(err).slice(0, 200) + ' ' + JSON.stringify(args, (k, v) => (v instanceof Uint8Array ? Buffer.from(v).toString('hex') : v)).slice(0, 400));
      if (crashes > 5) break;
    }
  }
}

if (crashes > 0) {
  console.error('FAIL ' + crashes + ' inputs crashed the core');
  process.exit(1);
}
console.log('fuzz: ' + iterations + ' inputs over ' + targets.length + ' entry points, no crash');
