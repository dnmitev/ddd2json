#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ ! -f go.sum ]; then
  echo "go.sum missing; downloading module checksums..."
  go mod tidy
fi

go mod download
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" "$ROOT_DIR/public/wasm_exec.js"
GOOS=js GOARCH=wasm go build -o "$ROOT_DIR/public/ddd_parser.wasm" ./cmd/wasm

