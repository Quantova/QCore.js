// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

// The guarded asset and payable call paths must enforce the same gateway guards as transfer, so a
// hostile gateway fee, a float nonce, and a non string chain id are all refused before signing, and
// an honest path submits exactly once.
// node test-asset-guards.js

const http = require('node:http');
const { Client, core } = require('./index.js');

function fail(msg) {
  console.error('FAIL ' + msg);
  process.exit(1);
}

(async () => {
  let submitted = 0;
  let feeQuon = '500';
  let nonceValue = 5;
  let chainId = 'Q-test-net-1';
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (req.url === '/v1/node_info') {
        res.end(JSON.stringify({ chain_id: chainId, head_height: 10, denomination: 'Quon',
          fee: { transfer_quon: feeQuon, quon_per_qtov: '1000000' }, version: 'test' }));
      } else if (req.url === '/v1/get_account') {
        res.end(JSON.stringify({ address: JSON.parse(body).address, nonce: nonceValue, balance: '0', scheme: 1, has_key: true }));
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
  const port = server.address().port;
  const client = new Client(`http://127.0.0.1:${port}`);
  const seed = '11'.repeat(32);
  const target = core.address(seed, 2n);
  const issuer = core.address(seed, 3n);

  async function refuses(label, fn) {
    submitted = 0;
    try {
      await fn();
      fail(`${label} was signed`);
    } catch (e) {
      if (submitted !== 0) fail(`${label} was refused but still submitted`);
    }
  }

  feeQuon = '2000000'; nonceValue = 5; chainId = 'Q-test-net-1';
  await refuses('asset call with a fee above the ceiling', () => client.assetCall(seed, 0, target, 'dead', issuer, '1000', 21000, '1000000'));
  feeQuon = '500'; nonceValue = 4.9;
  await refuses('asset call with a float nonce', () => client.assetCall(seed, 0, target, 'dead', issuer, '1000', 21000, '1000000'));
  nonceValue = 5; chainId = 12345;
  await refuses('asset call with a non string chain id', () => client.assetCall(seed, 0, target, 'dead', issuer, '1000', 21000, '1000000'));

  chainId = 'Q-test-net-1'; feeQuon = '2000000'; nonceValue = 5;
  await refuses('payable call with a fee above the ceiling', () => client.payableCall(seed, 0, target, 'dead', '1000', 21000, '1000000'));
  feeQuon = '500'; nonceValue = 4.9;
  await refuses('payable call with a float nonce', () => client.payableCall(seed, 0, target, 'dead', '1000', 21000, '1000000'));

  feeQuon = '500'; nonceValue = 5; chainId = 'Q-test-net-1';
  submitted = 0;
  await client.assetCall(seed, 0, target, 'dead', issuer, '1000', 21000, '1000000');
  if (submitted !== 1) fail('an honest asset call did not submit once');
  submitted = 0;
  await client.payableCall(seed, 0, target, 'dead', '1000', 21000, '1000000');
  if (submitted !== 1) fail('an honest payable call did not submit once');

  server.close();
  console.log('ok asset-guards');
})();
