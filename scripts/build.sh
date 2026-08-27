#!/usr/bin/env bash
# Copyright 2026 Quantova Inc
# SPDX-License-Identifier: Apache-2.0 OR MIT
set -euo pipefail

FLAGS="--remap-path-prefix=$HOME/quantova-stack=/qcore --remap-path-prefix=$HOME/.cargo=/cargo --remap-path-prefix=$HOME/.rustup=/rustup"

RUSTFLAGS="$FLAGS" wasm-pack build --target bundler --out-dir pkg -- --locked
RUSTFLAGS="$FLAGS" wasm-pack build --target nodejs --out-dir pkg-node -- --locked
