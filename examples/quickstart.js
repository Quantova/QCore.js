// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

// A runnable quickstart that mirrors the README. Run it with
//
//   node examples/quickstart.js
//
// The account creation and the address derivation run offline and always print. The transfer
// needs a Quantova node reachable at the base below, so it prints a plain note when none is
// running rather than failing.
//
// For fuller starters see the Q-Scaffold and the Q-Forge repositories under the Quantova org.
//   https://github.com/Quantova/Q-Scaffold
//   https://github.com/Quantova/Q-Forge

const { Client, core, generateSeed } = require('@quantovainc/qcore');

// THROWAWAY DEMONSTRATION SEED. Never use this for a real account and never put value behind it.
// Generate a real seed with generateSeed and keep it on the device as the only backup.
const THROWAWAY_SEED = 'ab'.repeat(32);

// A fixed ceiling this script is willing to pay in fees, chosen here and never read back from
// the gateway. It is the one limit standing between a hostile gateway and the balance.
const MAX_FEE_QUON = '2000';

// A loopback node. Plaintext http is allowed only to a loopback host, https anywhere else.
const NODE = 'http://127.0.0.1:8645';

async function main() {
  // Show that a real account is one call away, then use the throwaway seed for the rest.
  const freshSeed = generateSeed();
  console.log('a fresh seed looks like', freshSeed.slice(0, 8) + '... (keep it secret)');

  // The mnemonic is the only backup. Show it once and keep it on the device.
  const phrase = core.mnemonicFromSeed(THROWAWAY_SEED);
  console.log('mnemonic words', phrase.split(' ').length);

  // Derive the Q1 address for account index zero and for the recipient at index one.
  const from = core.address(THROWAWAY_SEED, 0n);
  const to = core.address(THROWAWAY_SEED, 1n);
  console.log('from', from);
  console.log('to  ', to);

  // Sign and submit a transfer through the Client, which caps the fee at the ceiling above.
  const client = new Client(NODE);
  try {
    const { signed, outcome } = await client.transfer(THROWAWAY_SEED, 0, to, '1000', MAX_FEE_QUON);
    console.log('submitted', signed.tx_id, outcome.verdict);
  } catch (err) {
    console.log('the transfer needs a running node at ' + NODE);
    console.log('reason', err.message);
  }
}

main();
