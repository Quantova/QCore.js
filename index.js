// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const raw = require('./pkg-node/qcore_js.js');
const { makeClient, wrapCore, generateSeed, validUntil, Network } = require('./shared.js');

const core = wrapCore(raw);
const Client = makeClient(core);
const vmCallFee = core.vmCallFee;

module.exports = { Client, core, generateSeed, validUntil, vmCallFee, Network };
