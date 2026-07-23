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
throws('a mainnet chain id is refused when not acknowledged', () => overUrl._guardMainnet('Q-main-net-1'));
ok('a testnet chain id passes the guard', overUrl._guardMainnet('Q-test-net-1') === undefined);
const overUrlAcked = new Client('https://rpc.quantova.org', { acknowledgeMainnet: true });
ok('an acknowledged client passes the guard', overUrlAcked._guardMainnet('Q-main-net-1') === undefined);

if (failures > 0) { console.error('\nnetwork: ' + failures + ' checks failed'); process.exit(1); }
console.log('\nnetwork: the safety gate holds');
