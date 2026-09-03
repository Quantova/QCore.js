// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT
//
// The owner order authorisation carries no deadline, so the contract nonce is the
// only term that expires it. Reading that nonce from the gateway lets the endpoint
// the signature protects against pick a future value and bank a valid order until
// the counter reaches it. expectedOrderNonce binds what the caller meant to sign.
const assert = require('assert');
const { makeClient } = require('./shared.js');
const core = require('./pkg-node/qcore_js.js');

const CONTRACT = 'Q1TC7YLRN4X6HWYU4UMX7KXLPEZNMHRYHCNDE35R2HJJWKJMVPCDGQRWGG5Q';

function client(reportedNonce) {
  const Client = makeClient(core);
  const c = new Client('https://example.invalid/v1/');
  c.nodeInfo = async () => ({ fee: { transfer_quon: '500' }, chain_id: 1 });
  c._guardMainnet = () => {};
  c._signingChainId = () => 1n;
  c.contractNonce = async () => reportedNonce;
  c.submit = async () => ({ ok: true });
  c.account = async () => ({ nonce: 0 });
  return c;
}

async function sign(c, expected) {
  return c.callSignedOrder(
    'aa'.repeat(32), 0, CONTRACT, '00000000',
    { schemeOff: 0, ptrOff: 0, fields: [] },
    'bb'.repeat(32), 0, 1000, '1000', expected
  );
}

(async () => {
  let threw = null;
  try { await sign(client(7n), 3n); } catch (e) { threw = e.message; }
  assert(threw && threw.includes('refusing to sign'),
    'a gateway reporting a nonce the caller did not expect must not be signed for');
  assert(threw.includes('7') && threw.includes('3'),
    'the error must name both the reported and the expected nonce');
  console.log('  ok   a mismatched gateway nonce refuses to sign');

  threw = null;
  try { await sign(client(3n), 3n); } catch (e) { threw = e.message; }
  assert(threw === null || !threw.includes('refusing to sign'),
    'the matching nonce must be allowed through');
  console.log('  ok   the expected nonce signs');

  console.log('\norder nonce: the caller can bind what the gateway may report');
})();
