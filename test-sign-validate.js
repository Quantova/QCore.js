// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

// Prove the exported low level signers guard the target address themselves, not only the high
// level Client, and that a token amount is carried at full width with no JavaScript number
// rounding. No network is needed. Run with: node test-sign-validate.js

const { core } = require('./index.js');

function fail(msg) {
  console.error('FAIL ' + msg);
  process.exit(1);
}

const seed = '11'.repeat(32);
const good = core.address(seed, 0n);

// A valid recipient and a valid target both sign.
if (!JSON.parse(core.sign_transfer(seed, 0n, good, '5', 0n, '1', core.localChainId())).tx_hex) fail('a valid recipient must sign');
if (!JSON.parse(core.sign_call(seed, 0n, good, '', 0n, 1000n, '1', core.localChainId())).tx_hex) fail('a valid target must sign');
if (!JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1000n, '1', '0', core.localChainId())).tx_hex) fail('a valid payable target must sign');

// A malformed address is refused by the exported signer before any signing.
const bad = ['not an address', '', 'Q1zzzz', good.slice(0, -1) + (good.slice(-1) === 'q' ? 'p' : 'q')];
for (const b of bad) {
  let threw = false;
  try { core.sign_transfer(seed, 0n, b, '5', 0n, '1', core.localChainId()); } catch { threw = true; }
  if (!threw) fail('sign_transfer signed a bad recipient ' + JSON.stringify(b));
  threw = false;
  try { core.sign_call(seed, 0n, b, '', 0n, 1000n, '1', core.localChainId()); } catch { threw = true; }
  if (!threw) fail('sign_call signed a bad target ' + JSON.stringify(b));
  threw = false;
  try { core.signPayableCall(seed, 0n, b, '', 0n, 1000n, '1', '0', core.localChainId()); } catch { threw = true; }
  if (!threw) fail('signPayableCall signed a bad target ' + JSON.stringify(b));
}

// The exported order call signer guards the contract address too.
let orderThrew = false;
try { core.buildSignedOrderCall('not an address', '00000000', 0n, 0n, '', '', 0n, seed, 0n, 0n); }
catch { orderThrew = true; }
if (!orderThrew) fail('buildSignedOrderCall built an order for a bad contract');

// A token amount is carried at full width. Two amounts that collapse to the same JavaScript
// number (2^53 and 2^53 + 1) must produce different signed transactions, which only holds if
// the amount never passes through a number.
const a = JSON.parse(core.sign_transfer(seed, 0n, good, '9007199254740992', 0n, '1', core.localChainId())).tx_hex;
const b = JSON.parse(core.sign_transfer(seed, 0n, good, '9007199254740993', 0n, '1', core.localChainId())).tx_hex;
if (a === b) fail('two amounts one apart signed identically, an amount was rounded through a number');

// A large amount well beyond 2^53 still signs as an exact string.
if (!JSON.parse(core.sign_transfer(seed, 0n, good, '18446744073709551615', 0n, '1', core.localChainId())).tx_hex) fail('a full width amount must sign');

const valueA = JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1000n, '1', '9007199254740992', core.localChainId())).tx_hex;
const valueB = JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1000n, '1', '9007199254740993', core.localChainId())).tx_hex;
if (valueA === valueB) fail('two payable values one apart signed identically, a value was rounded through a number');

if (!JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1000n, '1', '18446744073709551615', core.localChainId())).tx_hex) fail('a full width payable value must sign');

console.log('exported sign validation and amount precision: all cases passed');
