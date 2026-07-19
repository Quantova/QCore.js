# QCore.js

The Quantova post quantum client core for JavaScript and WebAssembly. It is the Rust core QCore.rs compiled to WebAssembly, so the key derivation, the post quantum signing, and every RPC request body are the core's and are never rewritten in JavaScript. The page does the fetch and the core does everything that has to be exactly right. That matters because a second implementation of the signing would be a second chance to be wrong with a user's money, so there is only ever the one.

One core with one binding for each language. QCore.rs is the Rust core. QCore.js is this JavaScript and WebAssembly binding over it. QCore.py is the Python binding over it. On npm this package installs as @qunatovainc/qcore.

## What this library is for

Any browser app, extension, or Node service that holds a Quantova account, reads the chain, and sends signed transactions. A wallet, a dApp, a block explorer front end, or a faucet page. Your code does the network fetch it prefers and QCore.js derives the key, signs the transaction, and builds the request body, so nothing about the cryptography or the byte layout of a transaction is written in JavaScript.

## The post quantum cryptography it handles

Quantova is post quantum from the ground. There is no elliptic curve anywhere in it, no secp256k1, no ECDSA, no Ethereum address, and no Substrate envelope. Every primitive below is Quantova's own from scratch implementation in the Q Crypto library, carrying no third party cryptography dependency, compiled into the WebAssembly module that ships with this package.

1. Key derivation. Your app holds one master seed of thirty two bytes. QCore.js grows a per account seed from it with SHAKE256 over the master seed, the scheme byte, and the account index, then derives a module lattice key pair from that seed. The node runs the identical derivation, so the account a key signs from is the account that holds the funds.

2. The signing scheme. The default is the module lattice signature ML-DSA-65 as standardised in FIPS 204, carried on the wire as scheme one. The hash based signature SLH-DSA as standardised in FIPS 205 is scheme two. Signing is deterministic, so one transaction body always signs to one exact run of bytes, which makes a signed transaction reproducible and testable in a browser.

3. The address. A Quantova address is the Bech32m Q1 string that renders the SHA3 256 hash of the scheme byte together with the whole module lattice public key of one thousand nine hundred fifty two bytes. The entire public key is bound into the address. Nothing is truncated to a twenty byte hash and there is no key recovery from a signature, so one address names exactly one post quantum key.

4. The transaction. A transaction body carries the sender, the nonce, the meter limit, the fee, and the call. The bytes a signature stands over are the SHA3 256 hash of the canonical body followed by a fixed Quantova transaction domain tag, so a transaction signature can never be replayed as another kind of signed message. QCore.js assembles the body, signs the digest inside the WebAssembly core, and returns the wrapper bytes and the transaction id ready for the gateway.

## How it is customised to Quantova and inherits nothing from the industry

Quantova shares no wire, no address, and no unit with any other chain, and QCore.js speaks only Quantova. The address is a Q1 Bech32m string over a full post quantum key, never a hex twenty byte address and never an SS58 string. Money is counted in Quon, the smallest unit, at one million Quon to one QTOV, and it always crosses the wire as a decimal string. You pass an amount as a decimal string or a BigInt and never as a JavaScript number, because a number silently rounds above 2^53 and would sign a wrong amount. The wire is the Quantova gateway, an HTTP POST to a named method under a version prefix with a flat JSON body, not Ethereum JSON RPC and not a Substrate WebSocket. The transaction encoding is Quantova's own canonical codec, not RLP and not SCALE. The signatures come from Q Crypto, Quantova's own implementation of the lattice and hash standards written from scratch, not a borrowed library. There is no ethers, no web3, and no polkadot here.

## Creating a wallet

```js
const { generateSeed, core } = require('@qunatovainc/qcore');

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

