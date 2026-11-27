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

## 2026-11-25 — etapa 2

### D9. Explorar: filtro por veículo e período
- **O backend ainda não filtra.** `GET /condominios/{c}/vagas` não aceita
  parâmetro: devolve todas as vagas no ar. "O veículo cabe" (porte P < M < G) e
  "o período está dentro da disponibilidade" são regras do backend (D61 dele),
  então o app **não** as reimplementa para filtrar a lista (spec do app, seção 10).
- **O que a lista faz hoje:** esconde só o que o próprio backend já marca: vagas
  da minha unidade (`da_minha_unidade`) e vagas sem a modalidade escolhida (preço
  `null`). O texto é "N vagas anunciadas · confira porte e período no detalhe", e
  não "cabem no seu carro" como na tela de referência.
- **Para onde vão o veículo e o período:** a escolha alimenta a cotação e o
  pedido. Se o veículo não couber ou o período não estiver disponível, a resposta
  do backend aparece na tela.
- **Pedido para o backend:** aceitar em `GET /vagas` os parâmetros `veiculo_id`,
  `modalidade`, `quantidade` e `inicio` (os mesmos da cotação), e devolver só as
  vagas em que o veículo cabe e o período cabe na disponibilidade. Com isso a
  lista passa a filtrar e o texto volta a ser o da referência.

### D10. Pagamento provisório (`src/payments/`)
- **Interface `PaymentProvider`:** `metodos()`, `disponivel(metodo)` e
  `preparar(metodo)`. O SDK do gateway entra atrás dela.
- **Implementação provisória:**
  - Pix: não leva token.
  - Cartão e Apple Pay: o backend exige `cartao_token` (D65 dele). Sem SDK, em
    dev o app gera `tok_dev_<aleatório>`, que o `FakeGateway` aceita, só para
    exercitar o fluxo.
  - Fora de dev, cartão e Apple Pay aparecem desabilitados ("em breve").
  - Apple Pay só aparece no iOS e vai como `cartao`.
- **Textos de quando cada forma cobra** (`src/payments/labels.ts`): seguem a D65
  do backend. No manual, o cartão reserva e só cobra na aprovação, e o Pix só é
  gerado na aprovação. No automático, a cobrança é na criação. "Até 15 minutos"
  para o Pix vem do prazo do backend (`min(agora + 15 min, início)`).
- **`Idempotency-Key`:** gerada na tela de pagamento. É a mesma em todas as
  tentativas do mesmo envio e muda se mudar o conteúdo (forma, período, vaga,
  veículo). Sem isso, o backend responderia `idempotency_key_reused`. O formato
  é `<tempo base36>_<22 aleatórios>`, com `crypto.getRandomValues` quando o
  runtime tem e `Math.random` quando não tem. A chave precisa ser única por
  pessoa, não secreta.
- **Mensagem para o dono** (`mensagem` em `PedidoIn`): fica fora por enquanto,
  porque nem a spec do app nem as telas a pedem.

### D11. Cancelar pedido
- A rota ainda não existe no backend (etapa 6 dele).
  `useCancelarPedido()` (`src/features/pedidos/hooks.ts`) devolve
  `{ disponivel: false }`, e a tela mostra "Cancelar pedido (em breve)"
  desabilitado, com um aviso.
- **Quando a rota existir:** `gen:api` e implementar a chamada nesse hook. A
  tela já está pronta para usar o `disponivel` e a mutação.

### D12. Navegação e telas da etapa 2
- **Gate:** `(app)/_layout` só mostra o app depois de resolver o vínculo (D2).
  Abaixo dele ficam as abas Explorar, Reservas e Perfil e, por cima delas, o
  detalhe da vaga, o pagamento, o pedido, o filtro (modal) e o novo veículo
  (modal).
- **Perfil provisório:** vínculo ativo, troca de vínculo, aceitar convite e sair
  (o que era a tela de início da etapa 1). O resto do Perfil é da etapa 4.
- **Vínculo sem unidade** (síndico, portaria): Explorar e Reservas explicam que
  alugar é para quem mora numa unidade. A tela da portaria é da etapa 4.
- **Filtro:** fica só em memória (modalidade, quantidade, início e veículo) e
  zera ao trocar de vínculo. O início é escolhido com dias (60 a partir de hoje)
  e horas cheias no fuso de São Paulo, com componentes próprios, sem biblioteca
  de date picker. A conversão de fuso usa o `Intl` (`fromLocalParts`), sem offset
  fixo.
- **Veículo:** com um só, ele é usado direto. Com vários, a pessoa escolhe; nunca
  "o primeiro da lista". O cadastro mínimo (placa, modelo, porte) existe para dar
  para pedir vaga. Editar e apagar ficam no Perfil (etapa 4).
- **Pedido em andamento:** consulta o backend a cada 15 s enquanto o pedido
  espera o dono ou o Pix. O contador é só visual: ao zerar, a tela consulta de
  novo, e o estado mostrado é sempre o do backend.
- **Pix copia e cola:** texto selecionável (tocar e segurar para copiar). Um
  botão "Copiar" exigiria o `expo-clipboard`, que não está na lista de
  dependências.
- **Placa:** aparece no pedido só quando a API devolve.
- **Tipos das rotas** (`.expo/types`, fora do git): são gerados quando o
  `npx expo start` roda. Se o `tsc` reclamar de uma rota nova, rode o
  `expo start` uma vez.

## 2026-11-25 — antes da etapa 3

### D13. Cancelamento (backend `feat/etapa-6@f89c479`, D72 dele)
- **D11 substituída:** `useCancelarPedido(pedidoId)` chama
  `POST .../pedidos/{p}/cancelar`. O botão pede confirmação e explica a regra
  em texto, sem valor: antes do início volta o pago menos a taxa, depois do
  início não há reembolso, e sem cobrança nada é cobrado. O valor devolvido
  aparece depois, vindo de `reembolso_centavos`. O app não calcula reembolso.
- O botão aparece nos estados que o backend aceita para quem alugou
  (`aguardando_dono`, `aguardando_pix`, `confirmado`, `em_uso`).
- **404 ao cancelar:** só quem fez o pedido cancela. Outro morador da unidade vê
  o pedido, mas recebe 404, e o app mostra "Só quem fez o pedido pode
  cancelar". O app ainda não sabe, antes de tentar, se o pedido é da pessoa.
  Falta no backend: um campo como `feito_por_mim` no `PedidoFeitoOut` (ver D16).
- `pedidosApi.cancelarRecebido` já existe para a tela do responsável (etapa 3).
  A rota do admin não é usada: o app não tem papel de admin.
- **Pagamento e estornos:** o app nunca leu o status do pagamento, e o
  `PedidoFeitoOut` não o expõe. Por isso a saída de `estorno_pendente` e
  `estornado` (migração 0009) não muda nada aqui.

### D14. Token de cartão falso: flag de build
- O gerador (`src/payments/devToken.ts`) só é carregado num
  `if (__DEV__) { require(...) }` em `provisorio.ts`. O Metro troca `__DEV__`
  por constante no bundle e remove o ramo morto no build de produção. Precisa
  ser o `__DEV__` literal no `if`: uma constante importada de outro módulo não
  é eliminada.
- **Prova:** `npm run test:prod-bundle` gera o bundle de produção (sem bytecode)
  e falha se `tok_dev_`, `devCardToken` ou `payments/devToken` estiverem nele.
  Controle negativo feito: trocando `__DEV__` por `true`, o script falha.
- **Fora de dev no backend:** o `FakeGateway` aceita qualquer token, menos
  `tok_recusado` e `tok_indisponivel`, em `dev` e `test`. Em `prod` o backend
  nem sobe com `PAYMENT_BACKEND=fake` (D65 dele). Ou seja, o fake não recusa um
  token falso; quem garante é não existir fake em prod. Um gateway real recusaria
  um token que ele não emitiu.

### D15. Prazo pelo relógio do servidor; polling
- Cada resposta da API traz o cabeçalho `Date`. `src/lib/serverClock.ts` guarda
  a diferença para o relógio do aparelho (comparando com o meio da requisição),
  e o `Countdown` do pedido usa `serverNow()`. O prazo (o instante) já vinha do
  backend.
- **Polling:** a cada 15 s só em `aguardando_dono` e `aguardando_pix`, e para nos
  demais estados. `setupAppFocus` liga o foco do TanStack Query ao `AppState`: em
  segundo plano o intervalo para, e ao voltar o pedido é buscado na hora
  (`refetchOnWindowFocus: 'always'`).

### D16. Membro e os pedidos da unidade
- **O que a spec manda:** o membro vê "as reservas feitas pela unidade e as
  reservas da vaga da unidade" e aluga "com o próprio pagamento". Não aprova,
  não recusa e não cancela como dono. O backend (D61 e D72) acrescenta: na
  unidade de quem aluga, cada um vê a placa e o Pix copia e cola só do próprio
  pedido, e só quem fez o pedido o cancela.
- **O que o app faz:** "Minhas reservas" lista os pedidos da unidade inteira
  (subtítulo "Pedidos feitos pela sua unidade"). A placa só aparece quando a
  API devolve. Sem o copia e cola, a tela de Pix diz que o pagamento é de quem
  fez o pedido. Cancelar um pedido de outro morador dá 404, com mensagem clara.
- **Lacuna:** o botão "Cancelar pedido" aparece também nos pedidos de outros
  moradores, porque a API não diz de quem é o pedido. Pedido ao backend: campo
  `feito_por_mim: bool` (ou equivalente) em `PedidoFeitoOut`. Com ele, o app
  esconde o botão e separa "meus" de "da unidade".

### D17. Scripts de verificação
- `npm run check:api-drift`: gera o OpenAPI do backend, direto do código em
  `../velo_backend`, sem servidor, ou de `OPENAPI_URL`, e compara com
  `src/api/schema.d.ts`. Falha se divergir e mostra o commit do backend usado.
- `npm run test:prod-bundle`: D14.
- `npm run test:e2e`: ponta a ponta com o código do app contra um backend de dev
  com o `seed-dev` (ver `e2e/README.md`). Roda em Node puro, com
  `EXPO_PUBLIC_USE_RN_FETCH=1` para manter o `fetch` do Node. No aparelho, o
  `expo/fetch` recebe o `Request` do polyfill `whatwg-fetch` do React Native,
  que guarda o corpo em `_bodyInit`, e o `expo/fetch` lê esse campo. No jest
  com o preset do Expo, o `Request` era o do Node, e por isso só lá dava
  "Unsupported BodyInit type". **Ainda vale conferir no iPhone um POST com corpo
  (login).**

### D18. Sincronização com o backend `origin/feat/etapa-6@36070ff`
- **`gen:api`** a partir do OpenAPI desse commit, numa worktree temporária só com o
  código commitado. `check:api-drift` com `BACKEND_REF=origin/feat/etapa-6` dá ok.
- **`PedidoFeitoOut` não mudou** (ainda sem `feito_por_mim`, D16).
- **Status de pedido que o app passou a descrever:**
  - `processando_pagamento` (D71 do backend; já existia e faltava no app): o
    gateway ainda não respondeu. Conta como pendente, então o polling continua;
  - `nao_entregue` (D78 do backend): a reserva foi encerrada por vaga não
    entregue. Mostra o reembolso quando a API o devolve no pedido.
- **Fora do app por enquanto:**
  - cancelamento pelo admin com `solicitado_por` (D75): o app não tem papel de
    admin;
  - a **tela de aviso de vaga não entregue** (D78): não está na spec do app. A
    rota já está no cliente gerado e foi exercitada no e2e. Falta decidir em que
    etapa entra.
- **Resultados esperados no e2e, revistos:**
  - o 3º cancelamento do dono da vaga 47 suspende a vaga (contagem por vaga, D76).
    O dono só seria suspenso com 5 pontos;
  - a perda de vínculo encerra a reserva já iniciada como `cancelado` por
    `sistema`, com reembolso das diárias restantes (D77);
  - vaga não entregue: aviso durante a reserva, o cancelamento fica bloqueado
    (`report_in_progress`), e com a confirmação do dono o pedido vai a
    `nao_entregue` com 100% de reembolso para diária;
  - estorno de uma cobrança criada pelo `seed-dev`: aceito pelo servidor, graças ao
    fake em arquivo do backend (D91 dele; era D82 na branch do seed).

## 2026-11-27 — etapa 3

### D19. Sincronização com o backend `feat/refactor-ciclos@74ed866`
- `gen:api` a partir do OpenAPI desse commit (worktree temporária, só o código
  commitado). `check:api-drift` com `BACKEND_DIR=<repo do backend>` e
  `BACKEND_REF=feat/refactor-ciclos` dá ok. (Da worktree do app, `../velo_backend`
  não existe; por isso o `BACKEND_DIR`.)
- O que mudou no contrato e o app passou a usar:
  - `feito_por_mim` em `PedidoFeitoOut` (D82 do backend): fecha a lacuna da D16;
  - `estorno_status` nos pedidos (D89/D90 do backend);
  - aceite dos termos no cadastro, `GET /termos`, `POST /me/aceites` e
    `termos_pendentes` em `GET /me` (D94 do backend);
  - `PATCH /me`, `GET /me/data-export` e `DELETE /me` (D93 do backend): ficam para
    o Perfil da etapa 4.
- A numeração do backend mudou no merge do seed: as decisões do seed citadas aqui
  como "D82 dele" viraram D91 e D92 lá.

### D20. `feito_por_mim` (fecha a D16)
- "Minhas reservas" separa "Meus pedidos" de "De outros moradores da unidade".
- No pedido de outro morador, sem botão de cancelar nem de avisar vaga não
  entregue, com o texto "Pedido feito por outro morador da sua unidade". O 404 do
  backend continua tratado (a permissão é dele).

### D21. Status do estorno
- O texto do reembolso sai de `reembolsoTexto` (`src/features/pedidos/labels.ts`),
  usado pelas duas visões: `em_processamento` → "está em processamento",
  `em_analise` → "está em análise pela equipe do Velo", `feito` → "Reembolso de
  R$ X feito". Sem status e com valor (dado antigo): "tem R$ X a receber". Nunca
  "você recebe" antes de `feito`.
- Nas listas, uma linha "Reembolso em processamento / em análise / feito".

### D22. Termos e política
- Cadastro: caixa "Li e aceito os Termos de uso (versão X) e a Política de
  privacidade (versão Y)", com as versões de `GET /termos`. Sem marcar, o botão
  fica desligado. `terms_version_outdated` (saiu versão nova com a tela aberta):
  desmarca e busca as versões de novo.
- Versão nova depois do cadastro: o `VinculoGate` mostra "Atualizamos nossos
  termos" quando `termos_pendentes` não está vazio. Um 403
  `terms_acceptance_required` em qualquer consulta recarrega o `/me`, e o gate
  aparece.
- **Pendente (produto/jurídico):** o texto dos dois documentos e onde o app os
  abre. Hoje a caixa cita só nome e versão.

### D23. Navegação da etapa 3
- Aba **Recebidos** só para o responsável (`href: null` para os outros papéis).
  A lista consulta a cada 15 s com a tela aberta (ainda sem push), e os pedidos
  esperando resposta vêm primeiro, com contador.
- **Minha unidade** pelo Perfil (só responsável): vaga da unidade, membros e
  convites. Membros e convites são só do responsável no backend.
- Convite de membro: e-mail opcional (com e-mail, o backend envia); o link só fica
  em memória e vai para a folha de compartilhar do iOS. "Gerar link novo" usa o
  reenviar (o link anterior para de valer).
- Remover membro pede confirmação com a regra do backend (perde o acesso na hora;
  reservas futuras canceladas com reembolso integral).

### D24. Anunciar vaga: ordem dos passos
**Aceito por você em 2026-11-27.**
- O design põe as fotos no passo 2 de 4. A API só aceita foto de vaga que já
  existe, e a criação exige dados, preços e modo de aprovação juntos. Por isso:
  1. dados; 2. preços e aprovação (cria a vaga **pausada**, `ativa: false`);
  3. fotos; 4. disponibilidade e "Publicar vaga" (`ativa: true`).
- Editar usa as mesmas telas, com atalhos 1–4 no topo, e "Pausar anúncio".
- Preço digitado em reais vira centavos inteiros por texto, sem float
  (`reaisParaCentavos`): "25,50", "25.50" e "1.250,00" são aceitos.
- Modalidade desligada vai como `null`. Pelo menos uma precisa estar ligada (o
  backend também confere).
- Disponibilidade: de um dia a outro, inclusive, digitados como DD/MM/AAAA (não há
  seletor de data nas dependências da spec): [00:00 do primeiro dia, 00:00 do dia
  seguinte ao último) em São Paulo, enviado em UTC.
- Fotos: o aviso do design ("Fotografe só a vaga vazia", com os três itens) e a
  caixa "Entendi. Minhas fotos mostram só a vaga vazia." vêm antes; câmera e
  galeria ficam desligadas até marcar. Toda foto vira JPEG (lado maior 2048,
  qualidade 0,8) com `expo-image-manipulator` e sobe para a URL assinada com o
  método e os cabeçalhos que a API devolveu. A primeira é a capa. Foto recusada
  pelo processamento do backend aparece como erro.
- Sem subconta ativa, a vaga não vai ao ar (D65 do backend): a tela diz isso. O
  cadastro da subconta fica para o pagamento real (etapa 5).
- Os textos da taxa não citam a porcentagem (a regra é do backend); o pedido
  mostra o valor da taxa e o que o dono recebe.

### D25. Vaga não entregue (D78 do backend)
- **Quem alugou** (só quem fez o pedido, em `confirmado` ou `em_uso`): "A vaga não
  estava livre" abre o aviso, com "desde quando" (agora, há 15 min, há 30 min, há
  1 h, pelo relógio do servidor), relato e foto opcionais. A janela (diária: até
  2 h do início) quem confere é o backend, e o erro aparece como veio. Com o aviso
  aberto, o botão de cancelar some (o backend recusa com `report_in_progress`).
  A foto segue o caminho da D24; se ela falhar, o aviso vale sem ela e a tela diz
  isso.
- **Responsável:** no pedido recebido, o cartão do aviso com o relato, o contador
  do prazo e "Confirmar que estava ocupada" ou "Contestar" (texto obrigatório,
  até 500). Sem resposta, vale o aviso (texto do backend).
- Os dois lados veem o resultado: em análise, aceito (com o reembolso), não aceito.

### D26. Dependências
- `expo-image-picker` e `expo-image-manipulator` (seção 1 da spec), instaladas com
  `npx expo install` nas versões do SDK 58, com os textos de permissão no
  `app.json`.

### D27. O que falta no backend (não contornado no app)
- ~~**Indicador de aviso aberto nas listas:**~~ **resolvido pela D28** (D98 do
  backend). Texto original: `PedidoRecebidoOut` (e
  `PedidoFeitoOut`) não dizem se há aviso de vaga não entregue. O app só descobre
  no detalhe (`GET .../vaga-indisponivel`, 404 = não há). Com prazo curto (60 min
  padrão), o responsável pode não ver a tempo. Pedido: campo como
  `aviso_nao_entrega: {status, prazo_dono_em} | null` nos dois schemas (e, depois,
  push).
- **Texto dos termos e da política** (D22).

## 2026-11-27 — revisão da etapa 3

### D28. Aviso de vaga não entregue nas listas (D98 do backend)
- O backend passou a mandar `aviso_nao_entregue_aberto` e `aviso_prazo_ate` nos
  pedidos. Na aba **Recebidos**, o pedido com aviso ganha o badge "Vaga não
  entregue · responda" e o contador até `aviso_prazo_ate`, e entra em "Esperando
  sua resposta". Com o aviso na análise do admin (sem prazo), o badge diz "em
  análise", sem contador.
- Em "Minhas reservas", uma linha "Aviso de vaga não entregue em andamento".

### D29. Cliente gerado: provisório até os merges no backend
- O `schema.d.ts` desta branch foi gerado da `feat/d27-aviso-nas-listas@04f9e76`
  do backend (que contém `feat/refactor-ciclos` e `feat/etapa-7`). Ordem
  combinada: os merges no backend (refactor-ciclos, etapa-7, D27) só com sua
  autorização; depois, `gen:api` e `check:api-drift` contra a `main` do backend, e
  só então esta branch.
- O `DELETE /me` do backend passou a responder `202` com
  `{"status": "anonimizada" | "exclusao_pendente"}` (D97 dele). O app ainda não
  usa essa rota (Perfil, etapa 4).

### D30. Cliente da `main` do backend, excluir conta e reembolso não aprovado
- `schema.d.ts` gerado da `main` do backend (2ee59fb); `check:api-drift` com
  `BACKEND_REF=main` dá ok. Fecha a D29.
- **Excluir conta** (Perfil › Excluir conta): senha atual e a caixa "Entendi que não
  dá para desfazer". O `DELETE /me` responde `202` (D97 do backend) com
  `anonimizada` ou `exclusao_pendente`; nos dois casos o app sai (apaga o refresh
  token e o cache inteiro) e o login mostra a mensagem certa uma vez: dados
  apagados, ou "a conta foi desligada e os dados são apagados quando o reembolso
  terminar". Senha errada e o 409 de reserva em andamento aparecem como erro.
- `estorno_status` ganhou `nao_aprovado` (D100 do backend): "O reembolso de R$ X
  não foi aprovado pela equipe do Velo", e o badge "Reembolso não aprovado".
