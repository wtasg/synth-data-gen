#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)

cleanup() {
	if [ -n "${server_pid:-}" ]; then
		kill "$server_pid" 2>/dev/null || true
	fi
	if [ -n "${client_pid:-}" ]; then
		kill "$client_pid" 2>/dev/null || true
	fi
}

trap cleanup EXIT INT TERM

(
	cd "$ROOT_DIR"
	deno task dev
) &
server_pid=$!

(
	cd "$ROOT_DIR/src/client"
	npm run dev
) &
client_pid=$!

wait "$server_pid" "$client_pid"
