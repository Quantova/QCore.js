// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { Client } = require('./index.js');

let failures = 0;
function check(label, ok) {
  if (ok) {
    console.log('  ok   ' + label);
  } else {
    failures += 1;
    console.log('  FAIL ' + label);
  }
}

function refuses(label, fn, needle) {
  try {
    fn();
    check(label, false);
  } catch (e) {
    check(label, String(e.message).includes(needle));
  }
}

const SEED = '00'.repeat(32);
const client = new Client('http://127.0.0.1:1');

refuses(
  'an account index past the safe integer range is refused, not silently rounded',
  () => client.address(SEED, 9007199254740993),
  'silently rounds',
);

refuses(
  'a fractional account index is refused',
  () => client.address(SEED, 1.5),
  'whole number',
);

refuses(
  'a negative account index is refused',
  () => client.address(SEED, -1),
  'unsigned 64 bit',
);

refuses(
  'an account index above the unsigned 64 bit range is refused',
  () => client.address(SEED, 2n ** 64n),
  'unsigned 64 bit',
);

const zero = client.address(SEED, 0);
const one = client.address(SEED, 1);
check('a plain index still derives an address', typeof zero === 'string' && zero.toUpperCase().startsWith('Q1'));
check('a BigInt index still derives an address', client.address(SEED, 1n) === one);
check('neighbouring indices derive different addresses', zero !== one);

console.log('\naccount index: the key an index selects is the key you asked for');
if (failures) process.exit(1);
