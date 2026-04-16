#!/usr/bin/env bash
set -euo pipefail

NODE20_BIN=""

for candidate in /usr/local/opt/node@20/bin /opt/homebrew/opt/node@20/bin; do
  if [ -x "$candidate/node" ]; then
    NODE20_BIN="$candidate"
    break
  fi
done

if [ -n "$NODE20_BIN" ]; then
  export PATH="$NODE20_BIN:$PATH"
fi

exec "$@"
