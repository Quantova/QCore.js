// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

import * as core from './pkg/qcore_js.js';
import { makeClient, generateSeed, Network } from './shared.js';

const Client = makeClient(core);

export { Client, core, generateSeed, Network };
