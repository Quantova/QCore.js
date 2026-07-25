// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

// Prove the JavaScript binding end to end against a running gateway. The core signs and
// builds every request, this test only does the fetch and reads the documented fields.

const { Client, core } = require('./index.js');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:8645';
  const client = new Client(url);
  const seed = '0b'.repeat(32); // the [11; 32] seed the proof accounts derive from

  const info = await client.nodeInfo();
  console.log('network', info.chain_id, 'fee', info.fee.transfer_quon, info.denomination);

  const to = client.address(seed, 1);
  // A fixed ceiling this test is willing to pay, chosen here and not read back from the gateway.
  const maxFeeQuon = '1000000';
  const { signed, outcome } = await client.transfer(seed, 0, to, '1000', maxFeeQuon);
  console.log('submitted', signed.tx_id, outcome.verdict, outcome.state || outcome.reason || '');
  if (outcome.verdict !== 'accepted') { console.error('FAIL: not accepted'); process.exit(1); }

  for (let i = 0; i < 40; i++) {
    const s = await client.transaction(signed.tx_id);
    if (s.status === 'finalised') { console.log('finalised at height', s.height, 'in', s.block); break; }
    await new Promise((r) => setTimeout(r, 250));
  }

  const a = await client.account(signed.from);
  console.log('sender now balance', a.balance, 'nonce', a.nonce);
  console.log('OK');
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
