# Prompt: app mobile do Velo (MVP)

Você vai construir o **app mobile do Velo**: moradores de um mesmo condomínio alugam vagas de garagem entre si, por dia, semana, mês ou ano. O backend já existe em `../velo_backend` (FastAPI) e a especificação dele está em `../velo_backend/docs/spec.md`. **Leia essa spec antes de começar**: as regras de negócio, de permissão e de LGPD valem também para o app. Em caso de dúvida sobre uma regra, o backend é a fonte da verdade. O app nunca reimplementa regra de negócio que o backend já decide (preço, fim do período, prazo, permissões).

As telas de referência estão em `../design_telas/` (arquivos `.dc.html`, abra no navegador ou leia o HTML). Elas mostram layout, hierarquia e textos. Siga o visual delas, mas implemente com componentes React Native, não copie o HTML.

Trabalhe em etapas (seção 9). Ao fim de cada etapa, rode só a checagem rápida (`tsc --noEmit`, `eslint`, `jest`), mostre o resultado com um resumo curto do que foi feito e do que ficou pendente, e **pare**. Uma branch por etapa (`feat/app-etapa-N`), commits pequenos, nada de push na `main`.

---

## 1. Stack

- Expo (SDK estável mais recente), TypeScript em modo `strict`
- Expo Router (navegação por arquivos)
- TanStack Query para dados do servidor
- `react-hook-form` + `zod` para formulários
- Cliente da API **gerado a partir do OpenAPI do backend**: `openapi-typescript` para os tipos e `openapi-fetch` para as chamadas. Nunca escreva tipos da API à mão. Script `npm run gen:api` que lê `http://localhost:8000/openapi.json` (o backend expõe isso em dev) e gera `src/api/schema.d.ts`, versionado.
- `expo-secure-store` para o refresh token
- `expo-image-picker` + `expo-image-manipulator` para fotos
- `@expo-google-fonts/archivo` e `@expo-google-fonts/jetbrains-mono`
- Sem biblioteca de UI. Componentes próprios com `StyleSheet` e um arquivo de tokens.
- Testes: `jest` + `@testing-library/react-native` para lógica e componentes críticos.

Não adicione dependência fora dessa lista sem dizer qual e por quê.

## 2. Visual (direção "Pista")

Tokens em `src/theme/tokens.ts`. Use só eles, nunca cor ou tamanho solto em tela.

| Token | Valor | Uso |
|---|---|---|
| `ink` | `#0e0e0e` | texto principal, botão secundário, cartão escuro |
| `bg` | `#ffffff` | fundo |
| `lime` | `#A3FF00` | ação principal, destaques (cor oficial da marca). **Texto sobre limão é sempre `ink`.** |
| `surface` | `#f6f6f3` | cartões |
| `chip` | `#f1f1ef` | chips não selecionados |
| `border` | `#e6e6e3` | bordas |
| `textMuted` | `#4a4a47` | texto secundário (contraste ≥ 4,5:1 com `bg` e `surface`) |
| `textSubtle` | `#5f5f5c` | rótulos pequenos |
| `onInk` | `#ffffff` | texto sobre `ink` |
| `danger` | `#FF1A1A` | vermelho da marca para erro: só fundo, borda ou ícone (3:1 com `bg`). **Nunca com texto branco pequeno.** |
| `dangerText` | `#D10000` | texto de erro (contraste ≥ 4,5:1 com `bg` e `surface`) |

- Fonte: Archivo (400 a 900). Títulos 24–28 px peso 800, letter-spacing −0,02 em. Placa e códigos em JetBrains Mono.
- Raios: 12 (inputs, chips de modalidade), 14–16 (cartões, botões), 18–20 (cartões grandes).
- Área de toque mínima de 44 × 44.
- Acessibilidade: todo botão só com ícone tem `accessibilityLabel`; estados (selecionado, desabilitado) expostos com `accessibilityState`; suporte ao tamanho de fonte do sistema sem quebrar layout.
- Ícones: um set de traço simples (`lucide-react-native` é aceitável, avise se usar). Nada de emoji na interface.

## 3. Telas

Referências em `../design_telas/`:

| Tela | Arquivo de referência | Quem vê |
|---|---|---|
| Explorar vagas | `Main.dc.html` | todos com vínculo |
| Detalhe e período | `Detalhe.dc.html` | todos com vínculo |
| Forma de pagamento | `Pagamento.dc.html` | quem aluga |
| Aguardando o dono | `Aguardando.dc.html` | quem aluga |
| Pedido recebido | `Pedido.dc.html` | **só o responsável** da unidade dona da vaga |
| Reservas (membro) | `Membro.dc.html` | membro da unidade |
| Anunciar: foto | `Foto.dc.html` | **só o responsável** |

Telas sem referência visual (siga o mesmo estilo):
- Login, cadastro por convite, verificação de e-mail, esqueci a senha, nova senha
- Anunciar vaga: dados da vaga (andar, número, medidas, porte, coberta), preços por modalidade (cada uma pode ser desligada), disponibilidade, modo de aprovação (automática ou manual com prazo 1h/4h/12h/24h)
- Pedidos recebidos (lista, responsável) e Minhas reservas (quem alugou)
- Minha unidade: responsável convida e remove membros
- Perfil: meus veículos (placa antiga e Mercosul), trocar senha, trocar e-mail, exportar meus dados, excluir conta
- Portaria: lista das placas autorizadas do dia (papel `portaria`)

**Visibilidade por papel:** o app esconde o que o papel não pode fazer (membro não vê "Anunciar", nem "Aprovar"), mas isso é só conforto. A permissão real é do backend: trate 403/404 em qualquer ação e nunca confie no estado local para liberar algo.

## 4. Regras que o app precisa respeitar

- **Preço, fim do período, prazo do dono e sugestão de modalidade mais barata vêm da cotação do backend.** O app mostra; não calcula.
- **Datas:** exibir no fuso `America/Sao_Paulo`, enviar ISO 8601 em UTC. Use `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })`.
- **Dinheiro:** a API trabalha em centavos inteiros. Formate com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Nunca use float para somar.
- **Placa:** só aparece quando a API devolve. Antes da aprovação o responsável vê só o porte, e o texto "Placa e modelo liberados depois que você aprovar".
- **Prazo:** mostre o prazo de resposta antes do pedido (selo na lista e no detalhe) e um contador depois. O contador é visual: quem decide se expirou é o backend.
- **Pagamento (até o backend ter gateway real):** a tela de pagamento existe com as três opções e os textos de quando cada uma cobra, mas envia o pedido com o método escolhido sem integração de SDK. Deixe a integração isolada em `src/payments/` atrás de uma interface, para trocar depois.

## 5. Segurança

- **Tokens:** o access token fica só em memória. O refresh token fica no `expo-secure-store` (nunca em `AsyncStorage`). Renovação automática com uma única requisição de refresh em andamento por vez (sem corrida entre várias telas).
- **Logout e exclusão de conta:** apagar o refresh token, limpar o cache inteiro do TanStack Query e qualquer estado local com dados de pessoas.
- **Logs:** nenhum token, senha, e-mail, telefone, placa ou nome em `console.log`, em erro ou em ferramenta de crash. Crie um logger que já mascare isso e use só ele. Em produção, nada de log de request/response.
- **Deep link do convite:** o token do convite chega por link. Ele só vai para a requisição de cadastro/aceite; não fica em log, em analytics, nem salvo depois de usado.
- **URLs:** nenhum dado pessoal ou token em query string.
- **Formulários:** validação com `zod` para dar feedback, mas sempre tratando o erro do backend (o backend é quem valida de verdade). Mensagens de erro de login genéricas, iguais às do backend.
- **Sem segredos no app.** Só a URL da API em `EXPO_PUBLIC_API_URL`. Qualquer variável `EXPO_PUBLIC_*` vai para dentro do app e é pública.
- **HTTPS obrigatório fora de dev.** Em dev, HTTP para o IP do Mac na rede local é aceitável.

## 6. Fotos

- Antes de abrir a câmera ou a galeria, mostrar o aviso "Fotografe só a vaga vazia: sem carros, placas ou pessoas" e exigir a confirmação (a API exige `aviso_confirmado: true`).
- Converter **toda** foto para JPEG com `expo-image-manipulator` antes de enviar (o backend não aceita HEIC), lado maior de no máximo 2048 px, qualidade ~0,8. O reencode também descarta EXIF e GPS.
- Envio direto para a URL assinada que a API devolve, com o content-type e o tamanho exatos pedidos.
- Máximo de 4 fotos por vaga.

## 7. Estrutura sugerida

```
app/                 rotas do Expo Router: (auth)/, (tabs)/, vaga/[id], pedido/[id] ...
src/api/             schema.d.ts gerado, cliente, interceptador de auth
src/auth/            sessão, secure store, refresh
src/theme/           tokens e tipografia
src/components/      Button, Chip, Card, Badge, Countdown, MoneyText, DateRangeText ...
src/features/<área>/ hooks de dados e componentes de cada área
src/payments/        interface + implementação provisória
src/lib/             logger com máscara, formatação de data e dinheiro
```

## 8. Rodar no iPhone

- Etapas 1 a 4: Expo Go. O app aponta para o backend no Mac pelo IP da rede local (`EXPO_PUBLIC_API_URL=http://<ip-do-mac>:8000`). Documente no README como subir o backend escutando em `0.0.0.0` só em dev.
- Pagamento com Apple Pay e SDK do gateway (depois): development build. Não faça isso antes de eu pedir.

## 9. Etapas

1. **Base:** projeto Expo, TypeScript strict, ESLint, Jest, tokens, fontes, componentes base, logger com máscara, cliente gerado do OpenAPI, sessão com refresh, telas de login, cadastro por convite (deep link), verificação de e-mail, esqueci a senha.
2. **Quem aluga:** Explorar (com filtro pelo meu veículo e período), Detalhe com cotação, Pagamento (provisório), Aguardando, Minhas reservas, cancelar pedido.
3. **Responsável:** Pedidos recebidos, aprovar/recusar com contador, Anunciar vaga (dados, preços, disponibilidade, aprovação, fotos), Minha unidade (convidar e remover membros).
4. **Resto:** visão do membro, Perfil (veículos, senha, e-mail, exportar dados, excluir conta), tela da portaria.
5. **Pagamento real:** só quando o backend tiver o gateway. Eu aviso.
6. **Push:** só quando eu pedir.

## 10. Regras para você

- Não invente requisito. Se algo não estiver aqui nem na spec do backend, pergunte, ou escolha o mais simples e registre em `docs/decisoes.md`.
- Se precisar de algo que o backend não oferece (uma rota, um campo), **não contorne no app**: me diga o que falta para eu pedir no backend.
- Quando uma checagem de segurança do Claude Code bloquear um comando, pare e me pergunte. Não reescreva para contornar.
- Nunca coloque token, senha ou dado pessoal real em código, teste, fixture ou commit.
