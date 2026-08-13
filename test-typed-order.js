// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { core } = require('./index.js');

let failures = 0;
function ok(label, cond) {
  if (cond) console.log('  ok   ' + label);
  else { failures++; console.log('  FAIL ' + label); }
}

const seedHex = '04'.repeat(32);
const deployer = core.address(seedHex, 0n);
const contract = core.contractAddress(deployer, 0n);
const to = 'ab'.repeat(32);
const fields = JSON.stringify([
  { offset: 128, width: 16, value: '18446744073709551716' },
  { offset: 80, width: 32, value: to },
]);

const res = JSON.parse(
  core.buildTypedOrderCall(core.localChainId(), contract, '3eccb9bc', 112n, 120n, 0n, fields, seedHex, 0n, 0n)
);
const msg = Buffer.from(res.message, 'hex');

ok('the wide amount widens the preimage to 136 bytes', msg.length === 136);
ok('the amount low word is first', msg.readBigUInt64BE(88) === 100n);
ok('the amount high word is second', msg.readBigUInt64BE(96) === 1n);
ok('the address follows the wide amount', msg.slice(104, 136).toString('hex') === to);

if (failures > 0) {
  console.log('\ntyped order: ' + failures + ' checks failed');
  process.exit(1);
}
console.log('\ntyped order: the wide preimage matches the contract layout');
