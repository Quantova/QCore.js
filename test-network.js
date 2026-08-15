// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const { Client, Network } = require('./index.js');

let failures = 0;
function ok(label, cond) {
  if (cond) { console.log('  ok   ' + label); } else { failures += 1; console.log('  FAIL ' + label); }
}
function throws(label, fn) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  ok(label, threw);
}

const testnet = Network.testnet();
ok('testnet chain id', testnet.chainId === 'Q-test-net-1');
ok('testnet rpc url', testnet.rpcUrl === 'https://rpc-testnet.quantova.org');
ok('testnet denomination', testnet.denomination === 'Quon');
ok('testnet decimals are six', testnet.decimals === 6);
ok('testnet is not mainnet', testnet.isMainnet === false);
ok('mainnet is flagged', Network.mainnet().isMainnet === true);
ok('mainnet rpc is not the testnet url', Network.mainnet().rpcUrl !== testnet.rpcUrl);

const client = new Client(testnet);
ok('testnet client carries its network', client.network.chainId === 'Q-test-net-1');

const liveMainnet = new Network({ name: 'mainnet', chainId: 'Q-main-net-1', rpcUrl: 'https://rpc.quantova.org', isMainnet: true });
throws('mainnet client without acknowledgement is refused', () => new Client(liveMainnet));
let acked = null;
try { acked = new Client(liveMainnet, { acknowledgeMainnet: true }); } catch { acked = null; }
ok('mainnet client opens with acknowledgement', acked !== null);

const overUrl = new Client('https://rpc-testnet.quantova.org');
ok('a plain url client is not forced to acknowledge mainnet by any gateway string', overUrl._guardMainnet() === undefined);
const hostileMainnet = new Client('https://rpc.quantova.org', { network: Network.mainnet() });
throws('a configured mainnet network is refused when not acknowledged, whatever the gateway reports', () => hostileMainnet._guardMainnet());
const overUrlAcked = new Client('https://rpc.quantova.org', { acknowledgeMainnet: true, network: Network.mainnet() });
ok('an acknowledged mainnet client passes the guard', overUrlAcked._guardMainnet() === undefined);

throws('a plain url client refuses a gateway that reports mainnet', () => overUrl._signingChainId({ chain_id: 'Q-main-net-1' }));
ok('a plain url client still binds a testnet reporting gateway', typeof overUrl._signingChainId({ chain_id: 'Q-test-net-1' }) === 'bigint');

const inconsistentMainnet = new Client('https://rpc.quantova.org', { network: new Network({ name: 'custom', chainId: 'Q-main-net-1', rpcUrl: 'https://rpc.quantova.org', isMainnet: false }) });
throws('a configured mainnet id is refused even with the isMainnet flag off and no acknowledgement', () => inconsistentMainnet._signingChainId({ chain_id: 'Q-main-net-1' }));
const inconsistentAcked = new Client('https://rpc.quantova.org', { acknowledgeMainnet: true, network: new Network({ name: 'custom', chainId: 'Q-main-net-1', rpcUrl: 'https://rpc.quantova.org', isMainnet: false }) });
ok('acknowledging lets the configured mainnet-id client sign', typeof inconsistentAcked._signingChainId({ chain_id: 'Q-main-net-1' }) === 'bigint');

if (failures > 0) { console.error('\nnetwork: ' + failures + ' checks failed'); process.exit(1); }
console.log('\nnetwork: the safety gate holds');
