// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { Client, Network, core } = require('./index.js');

let failures = 0;
function ok(label, cond) {
  if (cond) { console.log('  ok   ' + label); } else { failures += 1; console.log('  FAIL ' + label); }
}

function member(id, pk, stake, root) {
  return { id, attest_pk: pk.repeat(64).slice(0, 64), stake: String(stake), root_slots: '65536', root: root.repeat(64).slice(0, 64) };
}

const GENESIS = [member(1, 'a1', 2000, 'e0'), member(2, 'a2', 2000, 'e0'), member(3, 'a3', 2000, 'e0'), member(4, 'a4', 2000, 'e0')];
const GENESIS_JSON = JSON.stringify(GENESIS);
const PIN = core.rosterCommitment(0n, GENESIS_JSON);
const GENESIS_HASH = 'b'.repeat(64);

const FORGED = [member(1, 'ff', 9000, 'ee')];

function clientWithGateway(recentMembers) {
  const net = new Network({ name: 'anchor-test', chainId: 'Q-testNet-1.1', rpcUrl: 'https://gw.test', genesisHash: GENESIS_HASH, rosterCommitment: PIN, epochLength: 100 });
  const c = new Client(net);
  c._fetch = async () => { throw new Error('no network in test'); };
  c._call = async (method, body) => {
    const q = body ? JSON.parse(body) : {};
    if (method === 'node_info') return { head_height: 1000, protocol: 1, chain_id: 'Q-testNet-1.1' };
    if (method === 'get_roster_proof') return q.epoch === 0 ? { members: GENESIS, epoch: 0 } : { members: recentMembers, epoch: q.epoch };
    throw new Error('unexpected call ' + method);
  };
  return c;
}

(async () => {
  const c = clientWithGateway(FORGED);
  await c._anchorPinnedRoster();

  ok('the pinned genesis roster is trusted', c._trustedRosters.has(0n));

  let leaked = false;
  for (const [, roster] of c._trustedRosters.entries()) {
    const members = JSON.parse(roster);
    const keys = new Set(GENESIS.map((m) => m.attest_pk));
    for (const m of members) {
      const okStake = GENESIS.some((g) => g.attest_pk === m.attest_pk && g.stake === m.stake && g.root_slots === m.root_slots);
      if (!keys.has(m.attest_pk) || !okStake) leaked = true;
    }
  }
  ok('no unverified recent roster enters the trusted set (a gateway cannot forge the committee)', !leaked);

  console.log(failures === 0 ? 'roster-anchor: all ok' : `roster-anchor: ${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('roster-anchor harness error:', e.message); process.exit(1); });
