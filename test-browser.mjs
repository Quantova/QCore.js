// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

import { readFileSync } from 'node:fs';

function fail(msg) {
  console.error('FAIL ' + msg);
  process.exit(1);
}

function resolveExport(node, active) {
  if (typeof node === 'string') return node;
  for (const key of Object.keys(node)) {
    if (key === 'default' || active.has(key)) {
      const hit = resolveExport(node[key], active);
      if (hit) return hit;
    }
  }
  return null;
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const root = pkg.exports['.'];

const browserTarget = resolveExport(root, new Set(['browser', 'import', 'default']));
const esmTarget = resolveExport(root, new Set(['import', 'default']));
const nodeImportTarget = resolveExport(root, new Set(['node', 'import', 'default']));
const nodeRequireTarget = resolveExport(root, new Set(['node', 'require', 'default']));

if (browserTarget !== './browser.mjs') fail('browser condition must resolve to the guarded browser entry, got ' + browserTarget);
if (esmTarget !== './browser.mjs') fail('bundler import must resolve to the guarded browser entry, got ' + esmTarget);
if (/pkg\//.test(browserTarget) || /pkg\//.test(esmTarget)) fail('browser or import must never resolve to the raw wasm build');
if (nodeImportTarget !== './index.js') fail('node import must resolve to the node entry, got ' + nodeImportTarget);
if (nodeRequireTarget !== './index.js') fail('node require must resolve to the node entry, got ' + nodeRequireTarget);

const mod = await import(new URL(browserTarget, import.meta.url));

if (typeof mod.Client !== 'function') fail('the browser entry must export a Client constructor, got ' + typeof mod.Client);
if (!mod.Client.prototype || typeof mod.Client.prototype.transfer !== 'function') fail('the browser Client is missing the guarded transfer');
if (typeof mod.generateSeed !== 'function') fail('the browser entry must export generateSeed');
if (typeof mod.core !== 'object' || typeof mod.core.valid_address !== 'function') fail('the browser entry must expose the core');

const seed = mod.generateSeed();
if (!/^[0-9a-f]{64}$/.test(seed)) fail('generateSeed must return thirty two bytes of hex');

const client = new mod.Client('http://127.0.0.1:1');
const to = client.address(seed, 1);
if (!mod.core.valid_address(to)) fail('the browser core did not derive a valid address');

let amtThrew = false;
try { await client.transfer(seed, 0, to, 1000, '1000'); }
catch (e) { amtThrew = true; if (!/decimal string or a BigInt/.test(e.message)) fail('browser amount error unclear: ' + e.message); }
if (!amtThrew) fail('the browser Client must refuse a number amount');

let ceilThrew = false;
try { await client.transfer(seed, 0, to, '1000', 1000); }
catch (e) { ceilThrew = true; if (!/maximum fee/.test(e.message) || !/JavaScript number/.test(e.message)) fail('browser ceiling error unclear: ' + e.message); }
if (!ceilThrew) fail('the browser Client must refuse a number fee ceiling');

const raw = await import(new URL('./pkg/qcore_js.js', import.meta.url));
if (raw.Client !== undefined) fail('the raw wasm build was expected to have no Client');

console.log('browser entry: guarded Client resolved, number amount and number ceiling both refused');
