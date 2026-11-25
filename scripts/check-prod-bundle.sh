#!/usr/bin/env bash
# Prova que o build de produção não leva o token de cartão falso (D10).
# Gera o bundle de produção (sem bytecode, para o texto ficar legível) e falha
# se o prefixo do token falso ou o módulo devToken estiverem nele.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

# URL qualquer em https: o bundle de produção recusa http (src/lib/config.ts).
EXPO_PUBLIC_API_URL="https://api.example.invalid" CI=1 \
  npx expo export --platform ios --no-bytecode --output-dir "$OUT" >/dev/null

BUNDLE="$(find "$OUT" -name '*.js' -path '*ios*' | head -n 1)"
if [ -z "$BUNDLE" ]; then
  echo "check-prod-bundle: bundle de produção não encontrado" >&2
  exit 1
fi

fail=0
for marker in 'tok_dev_' 'devCardToken' 'payments/devToken'; do
  if grep -q -- "$marker" "$BUNDLE"; then
    echo "check-prod-bundle: FALHOU, \"$marker\" está no bundle de produção" >&2
    fail=1
  fi
done
# Sanidade: o bundle é mesmo o do app (o provedor provisório está nele).
if ! grep -q 'PagamentoIndisponivelError' "$BUNDLE"; then
  echo "check-prod-bundle: bundle inesperado (provedor de pagamento não encontrado)" >&2
  fail=1
fi
[ "$fail" -eq 0 ] && echo "check-prod-bundle: ok, o build de produção não tem o token falso"
exit "$fail"
