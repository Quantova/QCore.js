// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { Client, core, generateSeed } = require('@quantovainc/qcore');

const THROWAWAY_SEED = 'ab'.repeat(32);

const MAX_FEE_QUON = '2000';

const NODE = 'http://127.0.0.1:8645';

async function main() {
  const freshSeed = generateSeed();
  console.log('a fresh seed looks like', freshSeed.slice(0, 8) + '... (keep it secret)');

  const phrase = core.mnemonicFromSeed(THROWAWAY_SEED);
  console.log('mnemonic words', phrase.split(' ').length);

  const from = core.address(THROWAWAY_SEED, 0n);
  const to = core.address(THROWAWAY_SEED, 1n);
  console.log('from', from);
  console.log('to  ', to);

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
