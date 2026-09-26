// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT
const assert = require('assert');
const { makeClient } = require('./shared.js');
const core = require('./pkg-node/qcore_js.js');

const CONTRACT = 'Q1TC7YLRN4X6HWYU4UMX7KXLPEZNMHRYHCNDE35R2HJJWKJMVPCDGQRWGG5Q';

function client(reportedNonce, accountNonce) {
  const Client = makeClient(core);
  const c = new Client('https://example.invalid/v1/');
  c.nodeInfo = async () => ({ fee: { transfer_quon: '500' }, chain_id: 1, head_height: 10 });
  c._guardMainnet = () => {};
  c._signingChainId = () => 1n;
  c.contractNonce = async () => reportedNonce;
  c.submit = async () => ({ ok: true });
  c.account = async () => ({ nonce: accountNonce || 0 });
  return c;
}

async function sign(c, expected, layout) {
  return c.callSignedOrder(
    'aa'.repeat(32), 0, CONTRACT, '00000000',
    layout || { schemeOff: 0, ptrOff: 0, fields: [] },
    'bb'.repeat(32), 0, 1210, '1000', expected
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

  const local = client(0n);
  local._remember('k', 4n, { verdict: 'accepted' });
  assert.strictEqual(local._checkedNonce(4n, null, 'k'), 4n,
    'a submission that never landed must not push the next one past the nonce the chain admits');
  assert.strictEqual(local._checkedNonce(5n, null, 'k'), 5n);
  assert.strictEqual(local._checkedNonce(6n, null, 'k'), 6n,
    'a gateway nonce above the local one raises the local one rather than refusing');
  assert.strictEqual(local._nextNonces.get('k'), 6n);
  assert.strictEqual(local._checkedNonce(4n, null, 'k'), 4n);
  assert.strictEqual(local._nextNonces.get('k'), 6n, 'the local nonce never moves backwards');
  threw = null;
  try { local._checkedNonce(6n, 7n, 'k'); } catch (e) { threw = e.message; }
  assert(threw && threw.includes('you expected 7'),
    'an expected nonce the account has not reached is refused, the mempool admits only the reported one');
  assert.strictEqual(local._checkedNonce(6n, 6n, 'k'), 6n);
  console.log('  ok   the local nonce follows the chain and an expected nonce must match it');

  const ordered = client(5n, 2n);
  const layout = { schemeOff: 120, ptrOff: 128, fields: [{ offset: 136, width: 8, value: '1' }] };
  const done = await sign(ordered, 5n, layout);
  assert.strictEqual(done.orderNonce, 5n);
  const caller = core.address('aa'.repeat(32), 0n);
  const held = ordered._signedNonces.get(caller);
  assert(held && held.has('2') && !held.has('5'),
    'the signature is held against the account nonce it was signed at, not the order nonce');
  console.log('  ok   a signed order holds the account nonce it used');

  const Client = makeClient(core);
  const keyed = new Client('https://example.invalid/v1/');
  const signer = 'cc'.repeat(32);
  const want = core.nonceSlotKey(signer);
  let asked = null;
  keyed._call = async (method, body) => {
    asked = { method, body: JSON.parse(body) };
    return { address: CONTRACT, slots: [{ slot: want, value: '9' }] };
  };
  assert.strictEqual(await keyed.contractNonce(CONTRACT, signer), 9n);
  assert.strictEqual(asked.method, 'get_storage_at',
    'the nonce is read by its own key, a full storage listing is capped and can miss it');
  assert.deepStrictEqual(asked.body.keys, [want]);
  console.log('  ok   the order nonce is read by its own key');

  console.log('\norder nonce: the caller can bind what the gateway may report');
})();
