# Security Policy

QCore.js is the Quantova client core for JavaScript. It derives keys, signs transactions, and builds every request body inside one compiled core, so a flaw here can touch a user's funds. We take reports about it seriously. Quantova is at the testnet and pre audit stage, so nothing here should be read as a claim that the package is audited or production hardened.

## Reporting a vulnerability

Please do not report a security issue through a public GitHub issue, a pull request, a discussion, or social media. Report it privately through one of the channels below.

1. The private vulnerability reporting feature on this repository under its Security tab, which opens a confidential advisory visible only to the maintainers.
2. The Quantova bug bounty page at https://quantova.org/bug-bounty/, which is the primary intake and tracks your report for triage and any reward.
3. Encrypted email to security@quantova.org for a report that needs encrypted handling.

Please include a clear description of the issue and its impact, the affected part of the package such as the signing, the transport guard, or the fee ceiling, step by step reproduction with a proof of concept where you can, and the version or commit where you saw it.

## What to expect

Your report is handled privately. We will acknowledge it, investigate, and keep you informed while we work on a fix. We ask that you give us reasonable time to release a fix before any public disclosure, that you test only against your own accounts and assets, and that you avoid actions that damage the network or reach data that is not yours.

## Scope

In scope is everything this package ships. The key derivation and post quantum signing in the compiled core, the Client with its fee ceiling and amount guard, the transport guard, the request body encoding, and the TypeScript types. A weakness in how ML-DSA-65, SLH-DSA, SHA-3, or SHAKE are used is exactly the kind of report we want.

Out of scope is third party applications and contracts not published by Quantova, social engineering, and findings with no realistic security impact.

## The fuller policy

The complete Quantova security policy, the disclosure timeline, the reward ranges, and the authoritative scope live in the Quantova security documentation. See https://quantova.org/bug-bounty/ and the org security documentation repository for the full text.
