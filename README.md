# velo_app

App mobile do **Velo** (Expo + TypeScript): moradores do mesmo condomínio alugam
vagas de garagem entre si.

- Especificação: [docs/spec.md](docs/spec.md)
- Telas de referência: [docs/design/](docs/design/) (abra os `.dc.html` no navegador)
- Decisões de projeto: [docs/decisoes.md](docs/decisoes.md)
- Backend: `../velo_backend` (regras de negócio e segurança em `../velo_backend/docs/spec.md`)

## Requisitos

- Node 20+ e npm
- iPhone com o app **Expo Go** na mesma rede Wi-Fi do Mac
- Backend rodando no Mac (ver abaixo)

## Subir o backend para o iPhone (só em dev)

O iPhone acessa o backend pelo IP do Mac na rede local, então o servidor precisa
escutar em `0.0.0.0`. **Faça isso só em dev, numa rede de confiança**: assim a
API fica acessível para qualquer aparelho dessa rede.

```bash
cd ../velo_backend
uv run uvicorn --factory app.main:create_app --reload --host 0.0.0.0 --port 8000
```

IP do Mac: `ipconfig getifaddr en0`.

## Rodar o app

```bash
cp .env.example .env      # ajuste EXPO_PUBLIC_API_URL para http://<ip-do-mac>:8000
npm install
npx expo start            # leia o QR com a câmera do iPhone (abre no Expo Go)
```

`EXPO_PUBLIC_API_URL` é a única configuração. Fora de dev ela precisa ser
`https://` (o app recusa subir com http).

### Links dos e-mails em dev

Em dev, os e-mails do backend (convite, verificação, nova senha) saem no
terminal do servidor. As telas de cadastro, verificação, nova senha e aceitar
convite têm um campo **"Colar o link do e-mail (só em dev)"**: copie o link do
terminal e cole ali. O campo não existe em build de produção. Em produção o
caminho será universal link (ver `docs/decisoes.md`, D1).

## Cliente da API

Os tipos da API são gerados do OpenAPI do backend e ficam versionados em
`src/api/schema.d.ts`. Com o backend rodando em dev:

```bash
npm run gen:api           # lê http://localhost:8000/openapi.json
```

Nunca edite `schema.d.ts` à mão.

## Checagem

```bash
npx tsc --noEmit
npx eslint .
npx jest
```

(`npm run check` roda as três.)

Outras verificações:

- `npm run check:api-drift`: falha se `src/api/schema.d.ts` divergir do OpenAPI do backend.
- `npm run test:prod-bundle`: prova que o build de produção não leva o token de cartão falso.
- `npm run test:e2e`: ponta a ponta contra um backend de dev com seed (ver [e2e/README.md](e2e/README.md)).
