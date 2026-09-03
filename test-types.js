// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT
//
// index.d.ts is named as `types` in package.json and ships in the published tarball,
// so a syntax error in it breaks every TypeScript consumer of the package while every
// JavaScript test still passes. One shipped that way: a stray comma left by an edit to
// callSignedOrder made the whole declaration file unparseable.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tsc = path.join(__dirname, 'node_modules', '.bin', 'tsc');
if (!fs.existsSync(tsc)) {
  console.log('  skip  typescript is not installed, run npm install to check index.d.ts');
  process.exit(0);
}
try {
  execFileSync(tsc, ['--noEmit', '--skipLibCheck', 'index.d.ts'], {
    cwd: __dirname,
    stdio: 'pipe',
  });
} catch (e) {
  const out = (e.stdout || Buffer.alloc(0)).toString() + (e.stderr || Buffer.alloc(0)).toString();
  console.error('index.d.ts does not compile:\n' + out);
  process.exit(1);
}
console.log('  ok   index.d.ts compiles');
console.log('\ntypes: the published declaration file parses');
