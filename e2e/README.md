# Ponta a ponta (dev)

Roda o código do app (cliente gerado, sessão, pagamento provisório, chave de
idempotência, relógio do servidor) contra um backend de dev com o `seed-dev`.
A interface não entra: as telas têm testes próprios.

```bash
# backend: APP_ENV=dev, banco limpo e FAKE_GATEWAY_STATE_PATH no .env (D82 do
# backend), para o servidor conhecer as cobranças criadas pelo seed
rm -rf .dev
uv run alembic upgrade head
uv run python -m app.cli seed-dev > /tmp/seed.out   # guarda as senhas geradas
uv run uvicorn --factory app.main:create_app --port 8010

# app
E2E_API_URL=http://127.0.0.1:8010 E2E_SEED_FILE=/tmp/seed.out npm run test:e2e
```

Muda o estado do banco (cria, aprova e cancela pedidos, suspende a vaga 47,
remove o membro de A-103) e leva ~2 min (espera uma reserva começar):
rode o seed de novo, num banco limpo, antes de repetir.
