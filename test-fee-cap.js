// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

// Prove the fee ceiling with no running gateway, so this runs anywhere. A small mock gateway
// reports a fee, and the client must submit only when the fee is at or below the ceiling the
// caller allowed, must refuse and never submit when the fee is above it, and must reject a
// missing, malformed, or number ceiling before it ever touches the network. Run with:
// node test-fee-cap.js

const http = require('node:http');
const { Client } = require('./index.js');

function fail(msg) {
  console.error('FAIL ' + msg);
  process.exit(1);
}

(async () => {
  let submitted = 0;
  let feeQuon = '100';
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/v1/node_info') {
        res.end(JSON.stringify({
          chain_id: 'Q-test-net-1', head_height: 10, denomination: 'Quon',
          fee: { transfer_quon: feeQuon, quon_per_qtov: '1000000' }, version: 'test',
        }));
      } else if (req.url === '/v1/get_account') {
        res.end(JSON.stringify({ address: JSON.parse(body).address, nonce: 0, balance: '0', scheme: 1, has_key: true }));
      } else if (req.url === '/v1/submit_transaction') {
        submitted++;
        res.end(JSON.stringify({ verdict: 'accepted', state: 'fresh', tx_id: 'Qtxabc' }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'unknown_method', message: req.url }));
      }
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const client = new Client('http://127.0.0.1:' + server.address().port);
  const seed = '0b'.repeat(32);
  const to = client.address(seed, 1);

  // A fee at or below the ceiling signs and submits once.
  feeQuon = '100';
  const a = await client.transfer(seed, 0, to, '1000', '1000');
  if (a.outcome.verdict !== 'accepted') fail('a fee below the ceiling should be accepted');
  if (submitted !== 1) fail('an allowed transfer submits exactly once');

  // A fee above the ceiling is refused and never submits.
  feeQuon = '5000';
  let refused = false;
  try { await client.transfer(seed, 0, to, '1000', '1000'); }
  catch (e) { refused = true; if (!/above the maximum/.test(e.message)) fail('wrong refusal message: ' + e.message); }
  if (!refused) fail('a fee above the ceiling must be refused');
  if (submitted !== 1) fail('a refused transfer must never submit');

  // The ceiling is inclusive at the boundary, and a BigInt ceiling is accepted.
  feeQuon = '1000';
  const c = await client.transfer(seed, 0, to, '1000', 1000n);
  if (c.outcome.verdict !== 'accepted' || submitted !== 2) fail('a fee equal to the ceiling is allowed');

  // A missing, malformed, or negative ceiling fails before any network call.
  for (const bad of [undefined, null, 'abc', '-1', -1n]) {
    let threw = false;
    try { await client.transfer(seed, 0, to, '1000', bad); }
    catch (e) { threw = true; if (!/maximum fee/.test(e.message)) fail('unclear ceiling error: ' + e.message); }
    if (!threw) fail('a bad ceiling must be rejected: ' + String(bad));
  }
  if (submitted !== 2) fail('a bad ceiling must fail before submitting');

  // A ceiling passed as a JavaScript number is refused before any network call.
  let numCeil = false;
  try { await client.transfer(seed, 0, to, '1000', 1000); }
  catch (e) { numCeil = true; if (!/maximum fee/.test(e.message) || !/JavaScript number/.test(e.message)) fail('unclear number ceiling error: ' + e.message); }
  if (!numCeil) fail('a number fee ceiling must be refused');
  if (submitted !== 2) fail('a refused ceiling must never submit');

  // An amount passed as a JavaScript number is refused before any network call.
  let numRefused = false;
  try { await client.transfer(seed, 0, to, 1000, '1000'); }
  catch (e) { numRefused = true; if (!/decimal string or a BigInt/.test(e.message)) fail('unclear amount error: ' + e.message); }
  if (!numRefused) fail('a number amount must be refused');
  if (submitted !== 2) fail('a refused amount must never submit');

  server.close();
  console.log('fee ceiling: all cases passed');
})();
