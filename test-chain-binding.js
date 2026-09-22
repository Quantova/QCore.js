// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT
const assert = require('assert');
const { makeClient, Network } = require('./shared.js');
const core = require('./pkg-node/qcore_js.js');
const Client = makeClient(core);

function threw(fn) {
  try { fn(); return null; } catch (e) { return e.message; }
}

const bound = new Client('https://rpc-testnet.quantova.org', { expectedChainId: 'Q-test-net-3' });
const msg = threw(() => bound._signingChainId({ chain_id: 'Q-test-net-1' }));
assert(msg && msg.includes('refusing to sign'), 'a gateway naming another chain must be refused');
assert(msg.includes('Q-test-net-1') && msg.includes('Q-test-net-3'), 'the error names both chains');
console.log('  ok   expectedChainId refuses a gateway naming another chain');

assert(
  typeof bound._signingChainId({ chain_id: 'Q-test-net-3' }) === 'bigint',
  'the chain the caller asked for still signs'
);
console.log('  ok   the expected chain signs');

const plain = new Client('https://rpc-testnet.quantova.org');
assert(typeof plain._signingChainId({ chain_id: 'Q-test-net-3' }) === 'bigint', 'first answer accepted');
const drift = threw(() => plain._signingChainId({ chain_id: 'Q-other-net-1' }));
assert(drift && drift.includes('not naming one network'), 'a gateway that changes chain must be refused');
console.log('  ok   a gateway that changes its chain mid session is refused');

const refused = new Client('https://rpc.quantova.org');
assert(threw(() => refused._signingChainId({ chain_id: 'Q-main-net-1' })), 'mainnet is refused');
assert(
  typeof refused._signingChainId({ chain_id: 'Q-test-net-3' }) === 'bigint',
  'a refusal must not pin the chain it refused'
);
console.log('  ok   a refused chain is not pinned');

console.log('\nchain binding: the caller can name the network a signature is valid on');
