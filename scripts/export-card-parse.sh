#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
INPUT=${1:-}
OUTPUT=${2:-"$ROOT_DIR/scripts/fixtures/card-parser-export.json"}

if [ -z "$INPUT" ]; then
  echo "usage: ./scripts/export-card-parse.sh <card.DDD> [output.json]" >&2
  exit 1
fi

cd "$ROOT_DIR"
go run ./scripts/export-card-parse.go "$INPUT" >"$OUTPUT"
echo "Wrote $OUTPUT"
