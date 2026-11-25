#!/usr/bin/env bash
# Falha se src/api/schema.d.ts divergir do OpenAPI do backend.
#
# Fonte do OpenAPI, nesta ordem:
#   1. OPENAPI_URL (URL ou arquivo), se definida;
#   2. senão, gerado do código COMMITADO do backend em BACKEND_DIR (padrão
#      ../velo_backend), no ref BACKEND_REF (padrão HEAD; ex.: origin/feat/etapa-6),
#      numa worktree temporária, sem servidor nem banco. Mudanças não commitadas
#      do backend ficam de fora. Mostra o commit usado.
set -euo pipefail
cd "$(dirname "$0")/.."

TMP="$(mktemp -d)"
WT=""
cleanup() {
  if [ -n "$WT" ]; then git -C "$BACKEND_DIR" worktree remove --force "$WT" >/dev/null 2>&1 || true; fi
  rm -rf "$TMP"
}
trap cleanup EXIT

if [ -n "${OPENAPI_URL:-}" ]; then
  SRC="$OPENAPI_URL"
  echo "check-api-drift: OpenAPI de $SRC"
else
  BACKEND_DIR="$(cd "${BACKEND_DIR:-../velo_backend}" && pwd)"
  REF="${BACKEND_REF:-HEAD}"
  commit="$(git -C "$BACKEND_DIR" rev-parse --short "$REF")"
  echo "check-api-drift: OpenAPI gerado do backend $REF ($commit), só o que está commitado"
  WT="$TMP/backend"
  git -C "$BACKEND_DIR" worktree add --detach --quiet "$WT" "$commit"
  # O create_app lê a configuração do .env do backend (não é versionado).
  [ -f "$BACKEND_DIR/.env" ] && cp "$BACKEND_DIR/.env" "$WT/.env"
  SRC="$TMP/openapi.json"
  (cd "$WT" && uv run --quiet python -c \
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
