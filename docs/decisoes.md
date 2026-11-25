# Decisões do app

Registro das escolhas que não estão na spec do app nem na do backend (spec do app,
seção 10). A mais recente fica no fim.

## 2026-11-25 — etapa 1

### D1. Links de e-mail (convite, verificação, nova senha)
- **Sem esquema próprio.** O app não registra `velo://` nem outro esquema: um
  esquema próprio pode ser registrado por outro app e interceptar o token. O
  `app.json` não tem `scheme`.
- **Em produção:** universal link (https no nosso domínio), junto com o
  development build. Ainda não implementado; depende do domínio e do backend
  apontar `APP_BASE_URL` para ele.
- **Em dev (Expo Go):** as telas que precisam de token têm o campo "Colar o link
  do e-mail", que só existe com `__DEV__` (o componente `DevLinkField` não
  renderiza nada em produção).
- **Extração do token** (`src/lib/linkToken.ts`): aceita `?token=` e `#token=`
  (o backend vai migrar para fragmento) e prefere o fragmento se vierem os dois.
  Confere o caminho do link (`/convite`, `/verificar-email`, `/redefinir-senha`),
  aceita só http(s) e só tokens url-safe de 20 a 200 caracteres (o limite do
  backend).
- **O token não vai para lugar nenhum além da requisição:** fica no estado da
  tela, sai no corpo do POST e é apagado do estado depois do sucesso. Não vai em
  parâmetro de rota (que vira URL), em log ou em storage.

### D2. Vínculo ativo (condomínio, unidade e papel)
- Com um vínculo só, entra direto. Com vários, pergunta depois do login. Sem
  escolha guardada válida, pergunta de novo. Nunca "o primeiro da lista".
- A escolha fica no SecureStore (`velo.vinculo`). Não é dado pessoal. Ela é
  conferida contra a lista do `GET /me` a cada abertura: escolha que não existe
  mais faz perguntar de novo. O seletor do Perfil entra na etapa 4 (hoje há o
  botão "Trocar condomínio ou unidade" no início provisório).
- **Chave:** o `vinculo_id` que o `GET /me` devolve em cada vínculo (backend,
  D69), em `vinculoKey()`.
- **Histórico:** até a D69 do backend, o `GET /me` não trazia o id. A chave
  provisória combinava `condominio_id`, `unidade_id` e `papel`. Uma escolha
  guardada nesse formato antigo não bate com nenhum id e faz o app perguntar de
  novo, uma vez, sem migração.

### D3. Dependências além da seção 1 da spec
Aprovadas na conversa da etapa 1:
- `lucide-react-native` + `react-native-svg`: ícones de traço.
- `jest-expo`, `eslint-config-expo`, `eslint`, `@types/jest`: preset de teste e
  lint do Expo.
- `expo-linking`, `expo-constants`, `react-native-safe-area-context`,
  `react-native-screens`, `expo-status-bar`: exigidas pelo Expo Router.
- `expo-font` + `expo-asset`: carregar as fontes (`expo-asset` é peer de `expo-font`).

Ainda não mencionadas, são cola entre ferramentas que já estão na lista:
- `@hookform/resolvers`: liga o `zod` ao `react-hook-form`.
- `expo-splash-screen`: segura a splash até as fontes e a sessão carregarem
  (sem isso a tela pisca com a fonte do sistema).
- `react-dom`: peer do Expo Router. Fixada na versão do `react`, senão o npm
  puxa uma versão incompatível.
- `test-renderer`: peer do `@testing-library/react-native` 14.

`openapi-typescript` 7.13 declara peer `typescript ^5`, e o Expo 58 usa TS 6. O
`overrides` do `package.json` aceita o TS do projeto. O gerador roda só no Mac,
em `npm run gen:api`, e não entra no app.

### D4. Envelope de erro
O OpenAPI do backend não descreve o envelope de erro
(`{"error": {"code", "message", "request_id", "details"}}`), só o 422 padrão do
FastAPI. O app valida o envelope em tempo de execução com `zod`
(`src/api/errors.ts`). Ele não declara tipos de API à mão. A mensagem mostrada
é a do backend, que já é genérica onde precisa ser (login, cadastro, esqueci a
senha). Corpo fora do formato vira uma mensagem genérica, e o conteúdo dele
nunca é mostrado.

### D5. Sessão
- O access token fica só em memória. O refresh token fica no SecureStore com
  `WHEN_UNLOCKED_THIS_DEVICE_ONLY`: não vai para backup nem para outro aparelho.
- **Uma renovação por vez:** chamadas simultâneas esperam a mesma promessa. A
  corrida dispararia a detecção de reuso do backend e derrubaria a família de
  tokens.
- A renovação acontece 30 s antes de o access vencer, ou quando o backend
  responde 401. Cada requisição renova no máximo uma vez: um segundo 401 volta
  para a tela.
- Renovação recusada (401) encerra a sessão local. Falha de rede não encerra:
  na abertura do app, ela mostra "Sem conexão" com um botão "Tentar de novo" e
  o refresh token continua guardado.
- **Logout:** `POST /auth/logout` (melhor esforço), apaga o refresh token e
  limpa o cache inteiro do TanStack Query e o e-mail pendente em memória.
- O e-mail digitado no login ou no cadastro vai para a tela de verificação só
  por memória, nunca por parâmetro de rota.

### D6. Logger
- `src/lib/logger.ts` é o único lugar que usa `console`. O ESLint
  (`no-console: error`) bloqueia o resto. Também bloqueia importar AsyncStorage.
- **Máscara:** chaves sensíveis (senha, token, e-mail, nome, telefone, placa,
  modelo, link, url, authorization...) viram `[redacted]` em qualquer nível. No
  texto, a máscara pega JWT, `Bearer`, `token=` em query ou fragmento, e-mail,
  placa antiga e Mercosul, telefone e sequência url-safe com 20 ou mais
  caracteres. `Error` vira só nome + mensagem mascarada, sem stack.
- Em produção só saem `warn` e `error`. Não existe log de request ou response.

### D7. Estrutura
- As rotas ficam em `app/`, na raiz, como na seção 7 da spec, e não em `src/app/`.
- `(auth)`: login, cadastro, verificar-email, esqueci-senha, nova-senha.
  `(app)`: início provisório, escolher-vinculo, aceitar-convite. O
  `Stack.Protected` escolhe o grupo pelo estado da sessão. A permissão real
  continua no backend.
- Tela de início provisória: mostra o vínculo ativo, a troca de vínculo, aceitar
  outro convite e sair. As abas entram nas etapas 2 a 4.
- A confirmação de troca de e-mail (`/confirmar-email`) fica para a etapa 4,
  junto com o Perfil.

## 2026-11-25 — marca

### D8. Marca (kit em `../velo-brand-kit/`)
- **O que veio do kit:** só três arquivos, em `assets/brand/`.
  - `icon-1024.png`: ícone do app (`app/icon-1024.png` do kit, igual ao
    `png/icon-lime/1024.png`). Conferido: PNG RGB (tipo de cor 2), sem canal
    alfa e sem `tRNS`, como a Apple exige.
  - `splash-symbol-black.png`: splash, a partir de `png/symbol-black/1024.png`.
    O plugin `expo-splash-screen` só aceita PNG, não SVG. Fica centralizado, com
    160 pt de largura, sobre fundo `#ffffff`. O Expo Go mostra o ícone no lugar
    do splash (doc do SDK 58), então ele só aparece de verdade num build.
  - `symbol-black.svg`: fonte do vetor. O `d` e o `viewBox` desse arquivo estão
    em `src/components/brand/symbolPath.ts` e são desenhados com
    `react-native-svg` (`VeloSymbol`). Assim não entra transformador de SVG no
    Metro.
- **Removidos:** os placeholders do template do Expo (ícone, splash, ícones
  adaptativos do Android e favicon). O app é iOS no MVP, e o Android usa o
  `icon` comum até termos as camadas do ícone adaptativo.
- **Wordmark:** o kit não traz o wordmark em arquivo (a prancha mostra, mas não
  há SVG nem PNG). O `VeloLogo` monta símbolo + "Velo" em Archivo 800. Para leitor
  de tela, ele é uma imagem com o rótulo "Velo". O símbolo acompanha a fonte do
  sistema até 2×. Aparece no topo do login e do cadastro.
- **Cores (motivo da troca):** os valores estão na seção 2 da spec.
  - `lime` foi de `#D6F33A` para `#A3FF00` porque `#A3FF00` é a cor oficial do
    kit. Texto `ink` sobre ele dá 15,5:1.
  - O `#FF1A1A` da marca dá só 3,88:1 com branco. Serve para elemento gráfico
    (mínimo de 3:1), mas não para texto (mínimo de 4,5:1). Por isso o erro tem
    dois tokens: `danger`, para fundo, borda e ícone, e `dangerText` (`#D10000`,
    5,66:1 com `bg`) para texto. Texto branco pequeno sobre `danger` daria
    3,88:1 e fica proibido.
  - Os contrastes são verificados em `src/theme/__tests__/tokens.test.ts`.
