// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { Client, core, generateSeed } = require('@quantovainc/qcore');

const MAX_FEE_QUON = '2000';

const NODE = 'http://127.0.0.1:8645';

async function main() {
  const seed = generateSeed();
  console.log('seed', seed.slice(0, 8) + '...');

  const phrase = core.mnemonicFromSeed(seed);
  console.log('mnemonic words', phrase.split(' ').length);

  const from = core.address(seed, 0n);
  const to = core.address(seed, 1n);
  console.log('from', from);
  console.log('to  ', to);

  const client = new Client(NODE);
  try {
    const { signed, outcome } = await client.transfer(seed, 0, to, '1000', MAX_FEE_QUON);
    console.log('submitted', signed.tx_id, outcome.verdict);
  } catch (err) {
    console.log('the transfer needs a running node at ' + NODE);
    console.log('reason', err.message);
  }
}

main();
