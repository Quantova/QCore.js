// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

import { readFileSync } from 'node:fs';

const fail = (m) => { console.error('FAIL ' + m); process.exit(1); };

const cjs = readFileSync(new URL('./shared.js', import.meta.url), 'utf8').replace(/\n$/, '').split('\n');
const esm = readFileSync(new URL('./shared.mjs', import.meta.url), 'utf8').replace(/\n$/, '').split('\n');

if (cjs.length !== esm.length) {
  fail(`shared.js has ${cjs.length} lines and shared.mjs has ${esm.length}; they have drifted apart`);
}

for (let i = 0; i < cjs.length - 1; i += 1) {
  if (cjs[i] !== esm[i]) {
    fail(`shared.js and shared.mjs differ at line ${i + 1}:\n  js : ${cjs[i]}\n  mjs: ${esm[i]}`);
  }
}

const jsLast = cjs[cjs.length - 1];
const mjsLast = esm[esm.length - 1];
if (!jsLast.startsWith('module.exports = {')) fail('shared.js must end with its CommonJS export');
if (!mjsLast.startsWith('export {')) fail('shared.mjs must end with its ES module export');

const names = (line, prefix) => line.slice(prefix.length).replace(/\};?$/, '').split(',').map((s) => s.trim()).filter(Boolean).sort().join(',');
if (names(jsLast, 'module.exports = {') !== names(mjsLast, 'export {')) {
  fail('the two entries do not export the same names');
}

console.log('ok entry parity: the node and browser entries are the same code');
