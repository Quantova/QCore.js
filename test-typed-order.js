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
  { offset: 136, width: 16, value: '18446744073709551716' },
  { offset: 152, width: 32, value: to },
]);

const layoutHash = core.orderLayoutHash('3eccb9bc', JSON.stringify([
  { name: 'order.amount', type: 'u128', width: 16 },
  { name: 'order.to', type: 'Q_Address', width: 32 },
]));
const counterLayout = core.orderLayoutHash('6cad12fc', JSON.stringify([{ name: 'order.step', type: 'u64', width: 8 }]));

const res = JSON.parse(
  core.buildTypedOrderCall(core.localChainId(), contract, '3eccb9bc', layoutHash, 120n, 128n, 184n, 0n, fields, seedHex, 0n, 0n, 1900000000n)
);
const msg = Buffer.from(res.message, 'hex');
const mem = Buffer.from(res.call_args, 'hex').slice(4);

ok('the wide amount widens the preimage to 184 bytes', msg.length === 184);
ok('the tag is fixed', msg.slice(0, 8).toString() === 'QTVSGN03');
ok('the chain id is its own word', msg.readBigUInt64BE(8) === BigInt(core.localChainId()));
ok('the expiry follows the nonce', msg.readBigUInt64BE(96) === 1900000000n);
ok('the layout hash follows the expiry', msg.slice(104, 136).toString('hex') === layoutHash);
ok('the layout hash is the one the compiler emits for the counter bump order', counterLayout === '101bed5ef18ffd9a405fa75c5f6f3b3171c0a9276712d20d6cebe6916c417bd8');
ok('the expiry is placed at its argument slot', mem.readBigUInt64BE(184) === 1900000000n);
ok('the amount low word is first', msg.readBigUInt64BE(136) === 100n);
ok('the amount high word is second', msg.readBigUInt64BE(144) === 1n);
ok('the address follows the wide amount', msg.slice(152, 184).toString('hex') === to);

let shortLayout = false;
try { core.buildTypedOrderCall(core.localChainId(), contract, '3eccb9bc', 'ab', 120n, 128n, 184n, 0n, fields, seedHex, 0n, 0n, 1900000000n); }
catch { shortLayout = true; }
ok('a layout hash that is not 32 bytes is refused', shortLayout);

if (failures > 0) {
  console.log('\ntyped order: ' + failures + ' checks failed');
  process.exit(1);
}
console.log('\ntyped order: the wide preimage matches the contract layout');
