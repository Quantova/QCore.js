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

