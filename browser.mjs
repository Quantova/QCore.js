// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

import * as raw from './pkg/qcore_js.js';
import { makeClient, wrapCore, generateSeed, validUntil, Network } from './shared.mjs';

const core = wrapCore(raw);
const Client = makeClient(core);
const vmCallFee = core.vmCallFee;

export { Client, core, generateSeed, validUntil, vmCallFee, Network };
