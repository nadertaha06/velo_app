#!/usr/bin/env bash
# Falha se src/api/schema.d.ts divergir do OpenAPI do backend.
#
# Fonte do OpenAPI, nesta ordem:
#   1. OPENAPI_URL (URL ou arquivo), se definida;
#   2. senão, gerado direto do código do backend em BACKEND_DIR
#      (padrão ../velo_backend), sem servidor nem banco. Mostra o commit usado.
set -euo pipefail
cd "$(dirname "$0")/.."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ -n "${OPENAPI_URL:-}" ]; then
  SRC="$OPENAPI_URL"
  echo "check-api-drift: OpenAPI de $SRC"
else
  BACKEND_DIR="${BACKEND_DIR:-../velo_backend}"
  if [ ! -d "$BACKEND_DIR" ]; then
    echo "check-api-drift: backend não encontrado em $BACKEND_DIR (defina BACKEND_DIR ou OPENAPI_URL)" >&2
    exit 2
  fi
  commit="$(git -C "$BACKEND_DIR" rev-parse --short HEAD)"
  branch="$(git -C "$BACKEND_DIR" rev-parse --abbrev-ref HEAD)"
  dirty=""
  [ -n "$(git -C "$BACKEND_DIR" status --porcelain)" ] && dirty=" (com mudanças locais)"
  echo "check-api-drift: OpenAPI gerado do backend $branch@$commit$dirty"
  SRC="$TMP/openapi.json"
  (cd "$BACKEND_DIR" && uv run --quiet python -c \
    'import json; from app.main import create_app; print(json.dumps(create_app().openapi()))') >"$SRC"
fi

npx --no-install openapi-typescript "$SRC" -o "$TMP/schema.d.ts" >/dev/null 2>&1

if diff -u src/api/schema.d.ts "$TMP/schema.d.ts" >"$TMP/diff.txt"; then
  echo "check-api-drift: ok, schema.d.ts igual ao OpenAPI do backend"
else
  echo "check-api-drift: FALHOU, schema.d.ts divergiu do backend. Rode o gen:api." >&2
  head -n 60 "$TMP/diff.txt" >&2
  exit 1
fi
