// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { Client, core, generateSeed } = require('@quantovainc/qcore');

const MAX_FEE_QUON = '2000';

const GATEWAY = process.env.QTV_GATEWAY || 'https://rpc-testnet.quantova.org';

async function settle(client, address, ready) {
  for (let i = 0; i < 40; i += 1) {
    const account = await client.account(address).catch(() => null);
    if (account && ready(account)) return account;
    await new Promise((wake) => setTimeout(wake, 1500));
  }
  return null;
}

async function main() {
  const seed = generateSeed();
  console.log('seed', seed.slice(0, 8) + '...');

  const phrase = core.mnemonicFromSeed(seed);
  console.log('mnemonic words', phrase.split(' ').length);

  const from = core.address(seed, 0n);
  const to = core.address(seed, 1n);
  console.log('from', from);
  console.log('to  ', to);

  const client = new Client(GATEWAY);

  // A new account holds nothing, so take testnet funds before anything else.
  const claim = await fetch(GATEWAY + '/faucet/api/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: from, amount: 10 }),
  }).catch(() => null);
  if (!claim || !claim.ok) {
    console.log('the faucet did not dispense, so the account has nothing to spend');
    return;
  }
  console.log('faucet sent 10 TQTOV');

  const funded = await settle(client, from, (a) => BigInt(a.balance || 0) > 0n);
  if (!funded) {
    console.log('the faucet payment has not arrived yet, try again in a moment');
    return;
  }
  console.log('balance', funded.balance);

  // An account publishes its key once before it is allowed to send.
  await client.register(seed, 0, MAX_FEE_QUON);
  const ready = await settle(client, from, (a) => a.has_key);
  if (!ready) {
    console.log('the key registration has not landed yet, try again in a moment');
    return;
  }
  console.log('account registered');

  const { signed, outcome } = await client.transfer(seed, 0, to, '1000', MAX_FEE_QUON);
  console.log('submitted', signed.tx_id, outcome.verdict);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
