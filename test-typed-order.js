// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { core } = require('./index.js');

let failures = 0;
function ok(label, cond) {
  if (cond) console.log('  ok   ' + label);
  else { failures++; console.log('  FAIL ' + label); }
}

const seedHex = new Uint8Array(32).fill(0x04);
const deployer = core.address(seedHex, 0n);
const contract = core.contractAddress(deployer, 0n);
const to = 'ab'.repeat(32);
const fields = JSON.stringify([
  { offset: 168, width: 16, value: '18446744073709551716' },
  { offset: 184, width: 32, value: to },
]);

const layoutHash = core.orderLayoutHash('3eccb9bc', JSON.stringify([
  { name: 'order.amount', type: 'u128', width: 16 },
  { name: 'order.to', type: 'Q_Address', width: 32 },
]));
const counterLayout = core.orderLayoutHash('6cad12fc', JSON.stringify([{ name: 'order.step', type: 'u64', width: 8 }]));

const res = JSON.parse(
  core.buildTypedOrderCall(core.localChainId(), '5a'.repeat(32), contract, '3eccb9bc', layoutHash, 152n, 160n, 216n, 0n, fields, seedHex, 0n, 0n, 1900000000n)
);
const msg = Buffer.from(res.message, 'hex');
const mem = Buffer.from(res.call_args, 'hex').slice(4);

ok('the wide amount widens the preimage to 216 bytes', msg.length === 216);
ok('the tag is fixed', msg.slice(0, 8).toString() === 'QTVSGN04');
ok('the chain id is its own word', msg.readBigUInt64BE(8) === BigInt(core.localChainId()));
ok('the genesis follows the chain id', msg.slice(16, 48).toString('hex') === '5a'.repeat(32));
ok('the expiry follows the nonce', msg.readBigUInt64BE(128) === 1900000000n);
ok('the layout hash follows the expiry', msg.slice(136, 168).toString('hex') === layoutHash);
ok('the layout hash is the one the compiler emits for the counter bump order', counterLayout === '101bed5ef18ffd9a405fa75c5f6f3b3171c0a9276712d20d6cebe6916c417bd8');
ok('the expiry is placed at its argument slot', mem.readBigUInt64BE(216) === 1900000000n);
ok('the amount low word is first', msg.readBigUInt64BE(168) === 100n);
ok('the amount high word is second', msg.readBigUInt64BE(176) === 1n);
ok('the address follows the wide amount', msg.slice(184, 216).toString('hex') === to);

let shortLayout = false;
try { core.buildTypedOrderCall(core.localChainId(), '5a'.repeat(32), contract, '3eccb9bc', 'ab', 152n, 160n, 216n, 0n, fields, seedHex, 0n, 0n, 1900000000n); }
catch { shortLayout = true; }
ok('a layout hash that is not 32 bytes is refused', shortLayout);

if (failures > 0) {
  console.log('\ntyped order: ' + failures + ' checks failed');
  process.exit(1);
}
console.log('\ntyped order: the wide preimage matches the contract layout');
