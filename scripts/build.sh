#!/usr/bin/env bash
# Copyright 2026 Quantova Inc
# SPDX-License-Identifier: Apache-2.0 OR MIT
set -euo pipefail

STACK_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CARGO_HOME_DIR="${CARGO_HOME:-$HOME/.cargo}"
RUSTUP_HOME_DIR="${RUSTUP_HOME:-$HOME/.rustup}"
FLAGS="--remap-path-prefix=$STACK_ROOT=/qcore --remap-path-prefix=$CARGO_HOME_DIR=/cargo --remap-path-prefix=$RUSTUP_HOME_DIR=/rustup"

RUSTFLAGS="$FLAGS" wasm-pack build --target bundler --out-dir pkg -- --locked
RUSTFLAGS="$FLAGS" wasm-pack build --target nodejs --out-dir pkg-node -- --locked
node -e 'const fs = require("fs"); for (const dir of ["pkg", "pkg-node"]) { const file = dir + "/package.json"; const manifest = JSON.parse(fs.readFileSync(file, "utf8")); manifest.name = "@quantovainc/qcore-js"; manifest.private = true; manifest.files.sort(); fs.writeFileSync(file, JSON.stringify(manifest, null, 2)); }'
sed 's/^module\.exports = {\(.*\)};$/export {\1};/' shared.js > shared.mjs
