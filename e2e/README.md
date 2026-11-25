# Ponta a ponta (dev)

Roda o código do app (cliente gerado, sessão, pagamento provisório, chave de
idempotência, relógio do servidor) contra um backend de dev com o `seed-dev`.
A interface não entra: as telas têm testes próprios.

```bash
# backend: APP_ENV=dev, banco limpo
uv run alembic upgrade head
uv run python -m app.cli seed-dev > /tmp/seed.out   # guarda as senhas geradas
uv run uvicorn --factory app.main:create_app --port 8010

# app
E2E_API_URL=http://127.0.0.1:8010 E2E_SEED_FILE=/tmp/seed.out npm run test:e2e
```

Muda o estado do banco (cria, aprova e cancela pedidos e suspende a vaga 47):
rode o seed de novo, num banco limpo, antes de repetir.
