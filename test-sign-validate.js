// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { core, vmCallFee, Network } = require('./index.js');

function fail(msg) {
  console.error('FAIL ' + msg);
  process.exit(1);
}

function refusal(fn) {
  try { fn(); return null; } catch (e) { return e.message; }
}

const seed = '11'.repeat(32);
const own = core.address(seed, 0n);
const good = core.address(seed, 1n);
const until = 300n;

if (!JSON.parse(core.sign_transfer(seed, 0n, good, '5', 0n, '1', core.localChainId(), until)).tx_hex) fail('a valid recipient must sign');
if (!JSON.parse(core.sign_call(seed, 0n, good, '', 0n, 1210n, '1', core.localChainId(), until, '1')).tx_hex) fail('a valid target must sign');
if (!JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1210n, '1', '0', core.localChainId(), until, '1')).tx_hex) fail('a valid payable target must sign');

const bad = ['not an address', '', 'Q1zzzz', good.slice(0, -1) + (good.slice(-1) === 'q' ? 'p' : 'q')];
for (const b of bad) {
  let threw = false;
  try { core.sign_transfer(seed, 0n, b, '5', 0n, '1', core.localChainId(), until); } catch { threw = true; }
  if (!threw) fail('sign_transfer signed a bad recipient ' + JSON.stringify(b));
  threw = false;
  try { core.sign_call(seed, 0n, b, '', 0n, 1210n, '1', core.localChainId(), until, '1'); } catch { threw = true; }
  if (!threw) fail('sign_call signed a bad target ' + JSON.stringify(b));
  threw = false;
  try { core.signPayableCall(seed, 0n, b, '', 0n, 1210n, '1', '0', core.localChainId(), until, '1'); } catch { threw = true; }
  if (!threw) fail('signPayableCall signed a bad target ' + JSON.stringify(b));

  threw = false;
  try { core.signAssetCall(seed, 0n, b, '', good, '1', 0n, 1210n, '1', core.localChainId(), until, '1'); }
  catch { threw = true; }
  if (!threw) fail('signAssetCall signed a bad target ' + JSON.stringify(b));

  threw = false;
  try { core.signAssetCall(seed, 0n, good, '', b, '1', 0n, 1210n, '1', core.localChainId(), until, '1'); }
  catch { threw = true; }
  if (!threw) fail('signAssetCall signed a bad asset issuer ' + JSON.stringify(b));
}

let orderThrew = false;
try { core.buildSignedOrderCall(core.localChainId(), 'not an address', '00000000', 0n, 0n, '', '', 0n, seed, 0n, 0n); }
catch { orderThrew = true; }
if (!orderThrew) fail('buildSignedOrderCall built an order for a bad contract');

const a = JSON.parse(core.sign_transfer(seed, 0n, good, '9007199254740992', 0n, '1', core.localChainId(), until)).tx_hex;
const b = JSON.parse(core.sign_transfer(seed, 0n, good, '9007199254740993', 0n, '1', core.localChainId(), until)).tx_hex;
if (a === b) fail('two amounts one apart signed identically, an amount was rounded through a number');

if (!JSON.parse(core.sign_transfer(seed, 0n, good, '18446744073709551615', 0n, '1', core.localChainId(), until)).tx_hex) fail('a full width amount must sign');

const valueA = JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1210n, '1', '9007199254740992', core.localChainId(), until, '1')).tx_hex;
const valueB = JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1210n, '1', '9007199254740993', core.localChainId(), until, '1')).tx_hex;
if (valueA === valueB) fail('two payable values one apart signed identically, a value was rounded through a number');

if (!JSON.parse(core.signPayableCall(seed, 0n, good, '', 0n, 1210n, '1', '18446744073709551615', core.localChainId(), until, '1')).tx_hex) fail('a full width payable value must sign');

for (const [label, fn] of [
  ['a negative BigInt index', () => core.address(seed, -1n)],
  ['an index past the unsigned 64 bit range', () => core.address(seed, 1n << 64n)],
  ['an empty string index', () => core.address(seed, '')],
  ['a signed string index', () => core.address(seed, '+1')],
  ['a fractional index', () => core.address(seed, 1.5)],
  ['an unsafe number index', () => core.address(seed, 2 ** 60)],
  ['a boolean index', () => core.address(seed, true)],
  ['an empty amount', () => core.sign_transfer(seed, 0n, good, '', 0n, '1', core.localChainId(), until)],
  ['a negative amount', () => core.sign_transfer(seed, 0n, good, -1n, 0n, '1', core.localChainId(), until)],
  ['a hex amount', () => core.sign_transfer(seed, 0n, good, '0x10', 0n, '1', core.localChainId(), until)],
  ['an amount past the unsigned 64 bit range', () => core.sign_transfer(seed, 0n, good, '18446744073709551616', 0n, '1', core.localChainId(), until)],
  ['a negative nonce', () => core.sign_transfer(seed, 0n, good, '5', -1n, '1', core.localChainId(), until)],
  ['an empty nonce', () => core.sign_transfer(seed, 0n, good, '5', '', '1', core.localChainId(), until)],
  ['a negative fee', () => core.sign_transfer(seed, 0n, good, '5', 0n, '-1', core.localChainId(), until)],
  ['a missing deadline', () => core.sign_transfer(seed, 0n, good, '5', 0n, '1', core.localChainId())],
  ['a negative chain id', () => core.sign_transfer(seed, 0n, good, '5', 0n, '1', -1n, until)],
  ['a non string seed', () => core.address(42, 0n)],
]) {
  const why = refusal(fn);
  if (!why) fail(`${label} was accepted`);
  if (!/string of decimal digits|safe integer|from 0 to|must be a string/.test(why)) fail(`${label} was not refused before the core: ${why}`);
}
if (core.address(seed, '1') !== good || core.address(seed, 1) !== good) fail('a digit string or a safe integer index must still derive the same address');

const selfSend = refusal(() => core.sign_transfer(seed, 0n, own, '5', 0n, '1', core.localChainId(), until));
if (!selfSend || !/self transfer/.test(selfSend)) fail('a transfer to the sending account must be refused: ' + selfSend);
const forever = refusal(() => core.sign_transfer(seed, 0n, good, '5', 0n, '1', core.localChainId(), 0n));
if (!forever || !/never expires/.test(forever)) fail('a validity deadline of zero must be refused: ' + forever);
if (!refusal(() => core.signRegister(seed, 0n, 0n, '1', core.localChainId(), 0n))) fail('a registration with a zero deadline must be refused');

if (vmCallFee('500', 21000n) !== 9000n || core.vmCallFee(500, 1210) !== 500n || core.vmCallFee('500', 1n) !== 500n) {
  fail('the call fee is one transfer fee per started 1210 meter');
}
const meterLow = refusal(() => core.sign_call(seed, 0n, good, '', 0n, 1209n, '500', core.localChainId(), until, '500'));
if (!meterLow || !/meter limit/.test(meterLow)) fail('a meter below 1210 must be refused: ' + meterLow);
const meterHigh = refusal(() => core.signPayableCall(seed, 0n, good, '', 0n, 12500001n, vmCallFee('500', 12500001n), '0', core.localChainId(), until, '500'));
if (!meterHigh || !/meter limit/.test(meterHigh)) fail('a meter above 12500000 must be refused: ' + meterHigh);
if (!JSON.parse(core.sign_call(seed, 0n, good, '', 0n, 12500000n, vmCallFee('500', 12500000n), core.localChainId(), until, '500')).tx_hex) fail('the chain meter ceiling must sign');
const bigArgs = refusal(() => core.sign_call(seed, 0n, good, '00'.repeat(128 * 1024 + 1), 0n, 21000n, '9000', core.localChainId(), until, '500'));
if (!bigArgs || !/byte cap/.test(bigArgs)) fail('call arguments above 128 KiB must be refused: ' + bigArgs);
const cheap = refusal(() => core.signAssetCall(seed, 0n, good, '', good, '1', 0n, 21000n, '500', core.localChainId(), until, '500'));
if (!cheap || !/below/.test(cheap)) fail('a call priced at one transfer fee for 21000 meter must be refused: ' + cheap);
const noNetworkFee = refusal(() => core.sign_call(seed, 0n, good, '', 0n, 21000n, '9000', core.localChainId(), until));
if (!noNetworkFee || !/transfer fee/.test(noNetworkFee)) fail('a call signed without the network transfer fee must be refused: ' + noNetworkFee);

if (core.testnetChainId() !== core.chainIdFromName(Network.testnet().chainId)) fail('the testnet chain id must follow the testnet network');
if (core.testnetChainId() === core.chainIdFromName('Q-test-net-1')) fail('the testnet chain id must not be the retired testnet');

const phrase = core.mnemonicFromSeed(seed);
const messy = '  ' + phrase.toUpperCase().split(' ').join('   ') + '\n';
if (core.seedFromMnemonic(messy) !== seed) fail('a phrase with odd case and spacing must restore the same seed');
const wide = phrase.replace(/[a-z]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 97 + 0xff41));
if (core.seedFromMnemonic(wide) !== seed) fail('a phrase in full width letters must restore the same seed');
const standard = refusal(() => core.seedFromMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'));
if (!standard || !/standard BIP-39/.test(standard)) fail('a standard BIP-39 phrase must be named as one: ' + standard);

console.log('exported sign validation and amount precision: all cases passed');
