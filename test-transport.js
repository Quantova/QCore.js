// Prove the transport guard with no running gateway, so this runs anywhere. The Client must
// refuse to be built on a base that would send a signed request or a key operation over
// plaintext http to a non loopback host, and must accept https anywhere and http on a loopback
// node. The guard lives in the shared Client, so this proves the node and the browser entry at
// once. Run with: node test-transport.js

const { Client } = require('./index.js');

function fail(msg) {
  console.error('FAIL ' + msg);
  process.exit(1);
}

function accepts(base) {
  try { new Client(base); return true; } catch { return false; }
}

function rejects(base) {
  try { new Client(base); return false; } catch { return true; }
}

if (!accepts('http://127.0.0.1:8080')) fail('loopback http must be accepted');
if (!accepts('http://localhost:8080')) fail('localhost http must be accepted');
if (!accepts('http://[::1]:8080')) fail('ipv6 loopback http must be accepted');
if (!accepts('http://127.0.0.1:8080/')) fail('a trailing slash on a loopback base must be accepted');
if (!accepts('https://gateway.quantova.example')) fail('https must be accepted');
if (!accepts('https://203.0.113.7:443')) fail('https to a public host must be accepted');

if (!rejects('http://203.0.113.7:8080')) fail('plaintext http to a public ip must be refused');
if (!rejects('http://gateway.quantova.example')) fail('plaintext http to a public host must be refused');
if (!rejects('http://10.0.0.5:8080')) fail('plaintext http to a private lan host must be refused');
if (!rejects('ftp://127.0.0.1:21')) fail('a non http scheme must be refused');
if (!rejects('127.0.0.1:8080')) fail('a base with no scheme must be refused');
if (!rejects('')) fail('an empty base must be refused');

// The refusal message names the risk, not a network round trip, and it fires at construction.
let msg = '';
try { new Client('http://gateway.quantova.example'); } catch (e) { msg = e.message; }
if (!/plaintext http/.test(msg) || !/drain funds/.test(msg)) fail('the refusal message is unclear: ' + msg);

console.log('transport guard: all cases passed');
