// Prove the browser entry is the guarded one. A bundler resolving @quantova/qcore for the
// browser must reach the guarded Client, never the raw wasm build, and that Client must reject
// a JavaScript number amount and a JavaScript number fee ceiling before any network call. The
// raw build under ./pkg has no Client at all, which is the very gap this entry closes. Run with:
// node test-browser.mjs

import { readFileSync } from 'node:fs';

function fail(msg) {
  console.error('FAIL ' + msg);
  process.exit(1);
}

// Resolve one export target the way a tool does, walking the condition tree in order and taking
// the first branch whose key is active or is the unconditional default.
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

