// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

const core = require('./pkg-node/qcore_js.js');
const { makeClient, generateSeed, Network } = require('./shared.js');

const Client = makeClient(core);

module.exports = { Client, core, generateSeed, Network };
