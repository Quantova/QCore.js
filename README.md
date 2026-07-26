# QCore.js

[![ci](https://github.com/Quantova/QCore.js/actions/workflows/ci.yml/badge.svg)](https://github.com/Quantova/QCore.js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@quantovainc/qcore)](https://www.npmjs.com/package/@quantovainc/qcore)

The post quantum client core for Quantova. It signs with ML-DSA-65, builds Q1 addresses, and runs the same compiled core in the browser and in Node.

**This npm account and this package belong to Quantova Inc. It is the official Quantova client SDK. Any similarly named package published under a different account is not this one and is not from Quantova.**

## Install

```
npm install @quantovainc/qcore
```

## Quickstart

```js
const { Client, core, generateSeed } = require('@quantovainc/qcore');

async function main() {
  // Create an account. The seed is the only backup and it never leaves the device.
  const seed = generateSeed();
  const phrase = core.mnemonicFromSeed(seed);

  // Derive the Q1 address for account index zero, and a recipient at index one.
  const from = core.address(seed, 0n);
  const to = core.address(seed, 1n);
  console.log('from', from);

  // Open a client against a node you trust. Plaintext http is allowed only to a loopback node.
  const client = new Client('http://127.0.0.1:8645');

  // A fixed ceiling your app is willing to pay in fees, chosen here and never read back from the gateway.
  const MAX_FEE_QUON = '2000';

  // Amounts and the ceiling are decimal strings or BigInt values, never JavaScript numbers.
  const { signed, outcome } = await client.transfer(seed, 0, to, '1000', MAX_FEE_QUON);
  console.log('submitted', signed.tx_id, outcome.verdict);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
```

A runnable copy of this lives in [examples/quickstart.js](examples/quickstart.js).

## Security posture

Every signature is ML-DSA-65 as standardised in FIPS 204, and addresses and transaction digests are built with SHA-3. There is no elliptic curve anywhere in this package, no secp256k1 and no ECDSA. When you send through the Client you pass a maximum fee that you choose yourself, and the Client refuses to sign when the gateway reports a fee above it, so a hostile gateway cannot inflate the fee and drain the balance. The Client also refuses an unsafe transport. A remote gateway must be reached over https, and plaintext http is allowed only to a loopback node, because a fee and a nonce read back over plaintext could be rewritten on the wire. This package is at the testnet and pre audit stage, so please do not read it as audited.

## What this library is for

Any browser app, extension, or Node service that holds a Quantova account, reads the chain, and sends signed transactions. A wallet, a dApp, a block explorer front end, or a faucet page. Your code does the network fetch it prefers and QCore.js derives the key, signs the transaction, and builds the request body, so nothing about the cryptography or the byte layout of a transaction is written in JavaScript. A second implementation of the signing would be a second chance to be wrong with a user's money, so there is only ever the one.

## The post quantum cryptography it handles

Quantova is post quantum from the ground. There is no elliptic curve anywhere in it, no secp256k1, no ECDSA, no Ethereum address, and no Substrate envelope. Every primitive below is Quantova's own from scratch implementation in the Q Crypto library, carrying no third party cryptography dependency, compiled into the core module that ships with this package.

1. Key derivation. Your app holds one master seed of thirty two bytes. QCore.js grows a per account seed from it with SHAKE256 over the master seed, the scheme byte, and the account index, then derives a module lattice key pair from that seed. The node runs the identical derivation, so the account a key signs from is the account that holds the funds.

2. The signing scheme. The default is the module lattice signature ML-DSA-65 as standardised in FIPS 204, carried on the wire as scheme one. The hash based signature SLH-DSA as standardised in FIPS 205 is scheme two. Signing is deterministic, so one transaction body always signs to one exact run of bytes, which makes a signed transaction reproducible and testable in a browser.

3. The address. A Quantova address is the Bech32m Q1 string that renders the SHA3 256 hash of the scheme byte together with the whole module lattice public key of one thousand nine hundred fifty two bytes. The entire public key is bound into the address. Nothing is truncated to a twenty byte hash and there is no key recovery from a signature, so one address names exactly one post quantum key.

4. The transaction. A transaction body carries the sender, the nonce, the meter limit, the fee, and the call. The bytes a signature stands over are the SHA3 256 hash of the canonical body followed by a fixed Quantova transaction domain tag, so a transaction signature can never be replayed as another kind of signed message. QCore.js assembles the body, signs the digest inside the compiled core, and returns the wrapper bytes and the transaction id ready for the gateway.

5. The payable call. `core.signPayableCall` carries a native value and an explicit chain id alongside the sender, the nonce, the meter limit, the fee, and the call, so a call to a contract can move value in the same signed body a transfer does, and the same signature can be pinned to one network. The sender and the target never enter that signature as the rendered Q1 string, since a display convention can change over time. Each is parsed back to its raw thirty two byte payload first, and that payload, never the string, is what the preimage carries, so the signature stays bound to the account and never to how an address happened to be printed.

## How it is customised to Quantova and inherits nothing from the industry

Quantova shares no wire, no address, and no unit with any other chain, and QCore.js speaks only Quantova. The address is a Q1 Bech32m string over a full post quantum key, never a hex twenty byte address and never an SS58 string. Money is counted in Quon, the smallest unit, at one million Quon to one QTOV, and it always crosses the wire as a decimal string. You pass an amount as a decimal string or a BigInt and never as a JavaScript number, because a number silently rounds above 2^53 and would sign a wrong amount. The wire is the Quantova gateway, an HTTP POST to a named method under a version prefix with a flat JSON body, not Ethereum JSON RPC and not a Substrate WebSocket. The transaction encoding is Quantova's own canonical codec, not RLP and not SCALE. The signatures come from Q Crypto, Quantova's own implementation of the lattice and hash standards written from scratch, not a borrowed library. There is no ethers, no web3, and no polkadot here.

## Creating a wallet

```js
const { generateSeed, core } = require('@quantovainc/qcore');

const seed = generateSeed();                 // thirty two random bytes as hex from the platform source
const phrase = core.mnemonicFromSeed(seed);  // the only backup, shown once and kept on the device
```

## Using it

The last argument to a Client signing call, transfer, register, call, or callSignedOrder, is a fee
ceiling, the most you are ever willing to pay in fees for one transaction. You choose it yourself, as a
fixed number your app decides on its own, before you sign. The Client reads the gateway's reported fee,
compares it to your ceiling, and refuses to sign when the reported fee is above the ceiling, so an
independently chosen ceiling is the one limit standing between a hostile gateway and your balance. It
protects you only when you pick the number yourself. If you read the gateway's own reported fee and hand
that back as the ceiling, you have set the ceiling to whatever the gateway asked for and you have no
protection at all. Pass the ceiling as a decimal string or a BigInt, never a JavaScript number, for the
same reason as the amount, because a number silently rounds above 2^53 and could set the ceiling higher
than you intended.

This comparison lives in the Client and only in the Client. The raw core.* signing functions, such as
core.sign_transfer, take the actual fee that goes on the wire as their last argument, not a ceiling, and
do no gateway comparison at all. A developer who calls core.* directly has no fee cap, so reach for the
Client whenever a gateway you do not control reports the fee.

```js
const { Client } = require('@quantovainc/qcore');

const client = new Client('http://127.0.0.1:8645');
const seed = '0b'.repeat(32);
const to = client.address(seed, 1);

// A fixed ceiling your app is willing to pay, chosen here and never read back from the gateway.
const MAX_FEE_QUON = '2000';

// The amount is a decimal string or a BigInt, never a JavaScript number.
const { signed, outcome } = await client.transfer(seed, 0, to, '1000', MAX_FEE_QUON);
const status = await client.transaction(signed.tx_id);
```

The Client insists on a safe transport. A remote gateway must be reached over https, and plaintext
http is allowed only to a loopback node such as `127.0.0.1`, `localhost`, or `[::1]`. A base that points
plaintext http at any other host is refused when the Client is built, because a fee and a nonce read
back over plaintext are unauthenticated and rewritable on the wire and could be turned to drain funds.

An account funded by a transfer, such as a faucet claim, arrives with a balance but no key on the
chain, so it registers its key once before its first send. After that it sends as above.

```js
// Once, after the account is funded and before its first send.
await client.register(seed, 0, MAX_FEE_QUON);
```

A call that also moves value, such as a payable contract call, reaches for `core.signPayableCall`
directly. It takes the value and the chain id as explicit arguments, the value as a decimal string or a
BigInt for the same reason as an amount, and the chain id from `core.localChainId()`,
`core.mainnetChainId()`, or `core.testnetChainId()` so the network is never a magic number.

```js
const { core } = require('@quantovainc/qcore');

const signed = JSON.parse(
  core.signPayableCall(seed, 0n, contract, argsHex, nonce, meterLimit, fee, '1000', core.testnetChainId()),
);
```

## The compiled core

The compiled core in this package is only the shipping form of the one Rust core, built so the same key derivation, signing, and wire code runs in a browser and in Node. It is not a virtual machine and it is not what the chain runs. The Quantova chain executes only the QVM, the container machine that runs contracts. The compiled core here is a client side build artifact and nothing more.

## TypeScript

The package ships TypeScript types in `index.d.ts`, so the Client, the core functions, and the Network helpers are all typed with no extra install.

## Builds

The package ships one guarded surface, the Client with the fee cap and the amount guard, over two
builds of the one core, and every default entry hands you that same Client. Node resolves to
the node entry, which loads the nodejs build from `pkg-node`, reads it from disk, needs no
experimental flag, works on every supported Node for both require and import, and is the build the tests
run against. A browser, or a bundler such as webpack or Vite, resolves through the exports map to the
browser entry, which wraps the bundler build in `pkg` in the identical Client, so a browser wallet gets
the fee cap and the amount guard and never the bare signing functions.

The raw builds are still reachable on their own subpaths, `@quantovainc/qcore/pkg` for the bundler build
and `@quantovainc/qcore/pkg-node` for the nodejs build. Those export only the core.* functions, with no
Client, no fee cap, and no amount guard, and are for an advanced caller who assembles the fee comparison
alone. The default browser, import, node, and require resolutions never reach them.

To build both from source, run the two documented builds or `npm run build`.

```
wasm-pack build --target bundler --out-dir pkg
wasm-pack build --target nodejs --out-dir pkg-node
```

The offline test scripts run with `npm test`, and they need no network and no running gateway.

## Conformance vectors

The frozen conformance vectors live in the [conformance](conformance) folder of this repository. The address derivation is in `conformance/address.derivation.json`, the transfer in `conformance/transaction.transfer.json`, and the payable call in `conformance/transaction.payable.json`. The offline test `test-conformance.js` signs from these vectors and checks the binding matches them byte for byte, so a change that would move a signed transaction fails the test.

## Examples

The [examples](examples) folder holds a runnable quickstart that mirrors the one above. For fuller starters, see the Q-Scaffold and the Q-Forge repositories under the Quantova org, at https://github.com/Quantova/Q-Scaffold and https://github.com/Quantova/Q-Forge.

## Releases and provenance

Releases are published from CI by the publish workflow in `.github/workflows/publish.yml`, which runs on a pushed git tag. It builds the two wasm targets, runs the offline tests, and publishes with npm provenance, so the copy of the package on the registry carries a verified provenance badge that ties it to this exact public commit. Nothing is published to a registry without an explicit tag. This package handles a user's keys and a published version cannot be taken back.

For the provenance publish to run, the maintainer adds an `NPM_TOKEN` automation secret to the repository, or configures npm trusted publishing for the package so the workflow authenticates over OIDC with no stored token.

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md). Please report privately and not through a public issue.

## Ownership and license

QCore.js is built and owned by Quantova Inc, and the signing lives in one compiled core and is never rewritten in JavaScript. It carries none of the industry stack and inherits nothing from it. It is dual licensed under the Apache 2.0 and MIT licenses so any wallet, explorer, or service may build on it, and the copyright stays with Quantova Inc.
