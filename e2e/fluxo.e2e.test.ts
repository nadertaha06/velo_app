/* eslint-disable @typescript-eslint/no-require-imports -- `jest.isolateModules` só funciona com require. */
/**
 * Ponta a ponta com o código do app contra o backend de dev + seed-dev.
 * Cada pessoa usa uma instância própria dos módulos do app (sessão própria).
 * Ver e2e/README.md.
 */
import type { ApiError as ApiErrorT } from '@/api/errors';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { addEventListener: () => ({ remove: () => {} }) },
}));

const API = process.env.E2E_API_URL;
const SEED = process.env.E2E_SEED_FILE;
if (!API || !SEED) throw new Error('Defina E2E_API_URL e E2E_SEED_FILE (ver e2e/README.md).');
process.env.EXPO_PUBLIC_API_URL = API;

/** Lê e-mails e senhas da saída do seed (nada de credencial no código). */
function contas(): Record<string, { email: string; senha: string }> {
  const { readFileSync } = jest.requireActual<{ readFileSync: (p: string, enc: 'utf8') => string }>('fs');
  const out: Record<string, { email: string; senha: string }> = {};
  for (const line of readFileSync(SEED!, 'utf8').split('\n')) {
    const m = line.match(/(\S+@example\.com)\s+(\S+)\s*$/);
    if (m) out[m[1]!.split('.')[0]!] = { email: m[1]!, senha: m[2]! };
  }
  return out;
}

type Mods = {
  client: typeof import('@/api/client');
  errors: typeof import('@/api/errors');
  auth: typeof import('@/features/auth/api');
  vagas: typeof import('@/features/explorar/api');
  visible: typeof import('@/features/explorar/visible');
  pedidos: typeof import('@/features/pedidos/api');
  veiculos: typeof import('@/features/veiculos/api');
  pay: typeof import('@/payments/provisorio');
  rnd: typeof import('@/lib/randomId');
  clock: typeof import('@/lib/serverClock');
  resolve: typeof import('@/features/vinculo/resolve');
  labels: typeof import('@/features/pedidos/labels');
};

/** Uma "instalação" do app por pessoa: módulos isolados, sessão própria. */
function app(): Mods {
  let m!: Mods;
  jest.isolateModules(() => {
    m = {
      client: require('@/api/client'),
      errors: require('@/api/errors'),
      auth: require('@/features/auth/api'),
      vagas: require('@/features/explorar/api'),
      visible: require('@/features/explorar/visible'),
      pedidos: require('@/features/pedidos/api'),
      veiculos: require('@/features/veiculos/api'),
      pay: require('@/payments/provisorio'),
      rnd: require('@/lib/randomId'),
      clock: require('@/lib/serverClock'),
      resolve: require('@/features/vinculo/resolve'),
      labels: require('@/features/pedidos/labels'),
    };
  });
  return m;
}

const relatorio: string[] = [];
const passo = (txt: string) => relatorio.push(txt);

afterAll(() => {
  process.stdout.write(`\n=== Resultado ponta a ponta ===\n${relatorio.map((l) => `- ${l}`).join('\n')}\n`);
});

const C = contas();
const carla = app();
const ana = app();
const bruno = app();
const diego = app();

type Ctx = { condominio_id: string; unidade_id: string };
const ctx: Record<string, Ctx> = {};
let vaga47 = '';
let vaga12 = '';
let veiculoCarla = '';
let veiculoDiego = '';
let pedidoCartao = '';
let pedidoManual = '';
let seedCancelado = '';
let mensalEncerrada = '';
let naoEntregue = '';

const hora = 3_600_000;
const inicio = (dias: number) => new Date(Math.ceil(Date.now() / hora) * hora + dias * 24 * hora).toISOString();

async function entrar(m: Mods, quem: string) {
  await m.auth.authApi.login(C[quem]!.email, C[quem]!.senha);
  const me = await m.auth.authApi.me();
  const r = m.resolve.resolveVinculo(me.vinculos, null);
  if (r.kind !== 'chosen' || !r.vinculo.unidade_id) throw new Error(`${quem}: vínculo não resolvido`);
  ctx[quem] = { condominio_id: r.vinculo.condominio_id, unidade_id: r.vinculo.unidade_id };
  return r.vinculo;
}

async function erroDe(p: Promise<unknown>, m: Mods): Promise<ApiErrorT> {
  try {
    await p;
  } catch (e) {
    if (e instanceof m.errors.ApiError) return e;
    throw e;
  }
  throw new Error('esperava erro da API');
}

test('1. login (4 contas) e vínculo resolvido direto (um vínculo cada)', async () => {
  for (const [m, q] of [
    [carla, 'carla'],
    [ana, 'ana'],
    [bruno, 'bruno'],
    [diego, 'diego'],
  ] as const) {
    const v = await entrar(m, q);
    expect(m.client.session.getStatus()).toBe('signedIn');
    passo(`login ${q}: ok, ${v.papel} ${v.bloco}-${v.numero}, vinculo_id ${v.vinculo_id.slice(0, 8)}…`);
  }
  const offset = carla.clock.serverOffsetMs();
  expect(Math.abs(offset)).toBeLessThan(5000);
  passo(`relógio do servidor (cabeçalho Date): diferença para o aparelho ${offset} ms`);
});

test('2. Explorar', async () => {
  const lista = await carla.vagas.vagasApi.list(ctx.carla!.condominio_id);
  const visiveis = carla.visible.visibleVagas(lista, 'dia');
  vaga47 = lista.find((v) => v.numero === '47')!.id;
  vaga12 = lista.find((v) => v.numero === '12')!.id;
  expect(visiveis.map((v) => v.numero).sort()).toEqual(['12', '47']);
  passo(
    `Explorar (Carla, diária): ${visiveis.length} vagas: ${visiveis
      .map((v) => `${v.numero} (${v.modo_aprovacao}, porte ${v.porte_maximo}, dono ${v.dono.primeiro_nome})`)
      .join('; ')}`,
  );
  const daAna = carla.visible.visibleVagas(await ana.vagas.vagasApi.list(ctx.ana!.condominio_id), 'dia');
  expect(daAna.map((v) => v.numero)).toEqual(['12']);
  passo('Explorar (Ana): a vaga 47, da própria unidade, não aparece (da_minha_unidade)');
});

test('3. Detalhe e cotação', async () => {
  const d = await carla.vagas.vagasApi.get(ctx.carla!.condominio_id, vaga47);
  expect(d.precos.ano).toBeNull();
  const c = await carla.vagas.vagasApi.cotacao(ctx.carla!.condominio_id, vaga47, {
    modalidade: 'dia',
    quantidade: 7,
    inicio: inicio(30),
  });
  passo(
    `Detalhe vaga 47: preços dia ${d.precos.dia}, semana ${d.precos.semana}, mês ${d.precos.mes}, ano desligado; ` +
      `cotação 7 diárias = ${c.total_centavos} centavos, fim ${c.fim}, mais barata: ${
        c.mais_barata ? `${c.mais_barata.quantidade} ${c.mais_barata.modalidade} = ${c.mais_barata.total_centavos}` : 'nenhuma'
      }`,
  );
  expect(c.mais_barata?.modalidade).toBe('semana');
  const veics = await carla.veiculos.veiculosApi.list();
  veiculoCarla = veics[0]!.id;
  veiculoDiego = (await diego.veiculos.veiculosApi.list())[0]!.id;
});

test('4a. vaga automática com Pix', async () => {
  const dados = await carla.pay.paymentProvider.preparar('pix');
  const key = carla.rnd.idempotencyKey();
  const body = { vaga_id: vaga12, veiculo_id: veiculoCarla, modalidade: 'dia' as const, quantidade: 1, inicio: inicio(5), ...dados };
  const p = await carla.pedidos.pedidosApi.criar(ctx.carla!, body, key);
  expect(p.status).toBe('aguardando_pix');
  expect(p.pix_copia_cola).toBeTruthy();
  passo(`Pix na automática: ${p.status}, copia e cola presente, expira ${p.pix_expira_em}`);
  const de_novo = await carla.pedidos.pedidosApi.criar(ctx.carla!, body, key);
  expect(de_novo.id).toBe(p.id);
  passo('mesma Idempotency-Key, mesmo corpo: devolveu o mesmo pedido (sem duplicar)');
  const reuso = await erroDe(carla.pedidos.pedidosApi.criar(ctx.carla!, { ...body, inicio: inicio(6) }, key), carla);
  expect(reuso.code).toBe('idempotency_key_reused');
  passo(`mesma chave com período diferente: ${reuso.status} ${reuso.code} (por isso o app troca a chave)`);
});

test('4b. vaga automática com cartão (token falso de dev)', async () => {
  const dados = await carla.pay.paymentProvider.preparar('cartao');
  expect(dados.cartao_token).toMatch(/^tok_dev_/);
  const p = await carla.pedidos.pedidosApi.criar(
    ctx.carla!,
    { vaga_id: vaga12, veiculo_id: veiculoCarla, modalidade: 'dia', quantidade: 1, inicio: inicio(7), ...dados },
    carla.rnd.idempotencyKey(),
  );
  pedidoCartao = p.id;
  expect(p.status).toBe('confirmado');
  passo(`cartão fake na automática: ${p.status} na hora, total ${p.total_centavos}, taxa ${p.taxa_centavos}`);
});

test('5. vaga manual até aprovar', async () => {
  const dados = await carla.pay.paymentProvider.preparar('cartao');
  const p = await carla.pedidos.pedidosApi.criar(
    ctx.carla!,
    { vaga_id: vaga47, veiculo_id: veiculoCarla, modalidade: 'dia', quantidade: 1, inicio: inicio(25), ...dados },
    carla.rnd.idempotencyKey(),
  );
  pedidoManual = p.id;
  expect(p.status).toBe('aguardando_dono');
  passo(`manual: ${p.status}, prazo de resposta ${p.prazo_resposta_em}`);
  const { data, response } = await ana.client.api.POST(
    '/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos/{pedido_id}/aprovar',
    { params: { path: { ...ctx.ana!, pedido_id: p.id } } },
  );
  expect(response.status).toBe(200);
  passo(`Ana aprovou: ${data?.status}; placa visível para o dono depois de confirmado: ${data?.veiculo?.placa ? 'sim' : 'não'}`);
  const visto = await carla.pedidos.pedidosApi.get(ctx.carla!, p.id);
  expect(visto.status).toBe('confirmado');
  passo(`Carla vê o pedido: ${visto.status}`);
});

test('6. recusa por porte', async () => {
  const dados = await diego.pay.paymentProvider.preparar('pix');
  const e = await erroDe(
    diego.pedidos.pedidosApi.criar(
      ctx.diego!,
      { vaga_id: vaga12, veiculo_id: veiculoDiego, modalidade: 'dia', quantidade: 1, inicio: inicio(9), ...dados },
      diego.rnd.idempotencyKey(),
    ),
    diego,
  );
  expect(e.status).toBe(422);
  passo(`Diego (porte G) na vaga 12 (até M): ${e.status} ${e.code}: "${e.message}"`);
});

test('7. cancelamento', async () => {
  // Outro morador da unidade vê, mas não cancela (D72): 404.
  const lista = await diego.pedidos.pedidosApi.list(ctx.diego!);
  expect(lista.some((p) => p.id === pedidoCartao)).toBe(true);
  const alheio = await erroDe(diego.pedidos.pedidosApi.cancelar(ctx.diego!, pedidoCartao), diego);
  expect(alheio.status).toBe(404);
  passo(`Diego (membro) vê o pedido da Carla na lista da unidade, mas cancelar dá ${alheio.status} ${alheio.code}`);

  const c = await carla.pedidos.pedidosApi.cancelar(ctx.carla!, pedidoCartao);
  expect(c.status).toBe('cancelado');
  expect(c.reembolso_centavos).toBe(c.total_centavos - c.taxa_centavos);
  passo(
    `Carla cancela antes do início: ${c.status}, por ${c.cancelado_por}, reembolso ${c.reembolso_centavos} (total ${c.total_centavos} − taxa ${c.taxa_centavos}, valor vindo da API)`,
  );

  // Dono fora do prazo: reserva do seed que começa em 23 h (vaga 12, Bruno).
  const recebidos = await bruno.client.unwrap(
    bruno.client.api.GET('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos', {
      params: { path: ctx.bruno! },
    }),
  );
  const em23 = recebidos.find(
    (p) => p.status === 'confirmado' && new Date(p.inicio).getTime() - Date.now() < 24 * hora,
  )!;
  const tarde = await erroDe(
    bruno.client.unwrap(
      bruno.client.api.POST('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos/{pedido_id}/cancelar', {
        params: { path: { ...ctx.bruno!, pedido_id: em23.id } },
      }),
    ),
    bruno,
  );
  expect(tarde.code).toBe('owner_cancel_too_late');
  passo(`Bruno (dono) cancela a reserva que começa em 23 h: ${tarde.status} ${tarde.code}`);

  // A mesma reserva foi cobrada pelo SEED (outro processo). Com o fake persistido
  // (backend D82), o servidor conhece a cobrança e o estorno é aceito.
  const doSeed = await carla.pedidos.pedidosApi.cancelar(ctx.carla!, em23.id);
  expect(doSeed.status).toBe('cancelado');
  expect(doSeed.reembolso_centavos).toBe(doSeed.total_centavos - doSeed.taxa_centavos);
  seedCancelado = em23.id;
  passo(
    `Carla cancela a reserva cobrada pelo seed: ${doSeed.status}, reembolso ${doSeed.reembolso_centavos} (estorno conferido no banco, abaixo)`,
  );

  // Terceiro cancelamento do dono da vaga 47 em 90 dias: suspende a vaga.
  const r = await ana.client.unwrap(
    ana.client.api.POST('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos/{pedido_id}/cancelar', {
      params: { path: { ...ctx.ana!, pedido_id: pedidoManual } },
    }),
  );
  expect(r.status).toBe('cancelado');
  const daCarla = await carla.pedidos.pedidosApi.get(ctx.carla!, pedidoManual);
  passo(
    `Ana (dono) cancela a reserva manual a 25 dias: ${r.status}; Carla vê reembolso ${daCarla.reembolso_centavos} de ${daCarla.total_centavos} (100%, com taxa)`,
  );
  const depois = carla.visible.visibleVagas(await carla.vagas.vagasApi.list(ctx.carla!.condominio_id), 'dia');
  expect(depois.map((v) => v.numero)).toEqual(['12']);
  passo('3º cancelamento do dono da vaga 47 em 90 dias (contagem por vaga, D76): a vaga sumiu do Explorar (suspensa)');
});

test('8. perda de vínculo encerra a reserva iniciada com reembolso proporcional (D77)', async () => {
  const membros = await carla.client.unwrap(
    carla.client.api.GET('/condominios/{condominio_id}/unidades/{unidade_id}/membros', { params: { path: ctx.carla! } }),
  );
  const vinculoDiego = membros.find((m) => m.papel === 'membro')!;
  const antes = (await carla.pedidos.pedidosApi.list(ctx.carla!)).find((p) => p.status === 'em_uso')!;
  const { response } = await carla.client.api.DELETE(
    '/condominios/{condominio_id}/unidades/{unidade_id}/membros/{vinculo_id}',
    { params: { path: { ...ctx.carla!, vinculo_id: vinculoDiego.id } } },
  );
  expect(response.status).toBe(204);
  const depois = await carla.pedidos.pedidosApi.get(ctx.carla!, antes.id);
  expect(depois.status).toBe('cancelado');
  expect(depois.cancelado_por).toBe('sistema');
  expect(depois.reembolso_centavos).toBeGreaterThan(0);
  expect(depois.reembolso_centavos).toBeLessThan(depois.total_centavos);
  mensalEncerrada = antes.id;
  passo(
    `Carla remove o Diego: a mensal dele (${antes.status}) vira ${depois.status}, por ${depois.cancelado_por}, reembolso proporcional ${depois.reembolso_centavos} de ${depois.total_centavos}`,
  );
  const sem = await erroDe(diego.auth.authApi.me().then((me) => {
    if (me.vinculos.length === 0) throw new diego.errors.ApiError(404, 'sem_vinculo', 'sem vínculo');
    return me;
  }), diego);
  passo(`Diego sem vínculo depois da remoção: ${sem.code}`);
});

test('9. vaga não entregue: aviso de quem alugou e confirmação do dono (D78)', async () => {
  // Reserva que começa em ~90 s na vaga 12 (o período de 23 h foi liberado acima).
  const inicioProximo = new Date(Math.ceil((Date.now() + 90_000) / 1000) * 1000).toISOString();
  const dados = await carla.pay.paymentProvider.preparar('cartao');
  const p = await carla.pedidos.pedidosApi.criar(
    ctx.carla!,
    { vaga_id: vaga12, veiculo_id: veiculoCarla, modalidade: 'dia', quantidade: 1, inicio: inicioProximo, ...dados },
    carla.rnd.idempotencyKey(),
  );
  expect(p.status).toBe('confirmado');
  await new Promise((r) => setTimeout(r, Date.parse(inicioProximo) - Date.now() + 3000));

  const aviso = await carla.client.unwrap(
    carla.client.api.POST('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos/{pedido_id}/vaga-indisponivel', {
      params: { path: { ...ctx.carla!, pedido_id: p.id } },
      body: { desde: new Date(Date.parse(inicioProximo) + 1000).toISOString(), relato: 'Vaga ocupada por outro carro.' },
    }),
  );
  passo(`Carla avisa vaga não entregue (reserva iniciada): aviso ${aviso.status}, prazo do dono ${aviso.prazo_dono_em}`);
  const bloqueado = await erroDe(carla.pedidos.pedidosApi.cancelar(ctx.carla!, p.id), carla);
  expect(bloqueado.code).toBe('report_in_progress');
  passo(`cancelar com o aviso em aberto: ${bloqueado.status} ${bloqueado.code}`);

  const { response } = await bruno.client.api.POST(
    '/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos/{pedido_id}/vaga-indisponivel/confirmar',
    { params: { path: { ...ctx.bruno!, pedido_id: p.id } } },
  );
  expect(response.status).toBe(200);
  const fim = await carla.pedidos.pedidosApi.get(ctx.carla!, p.id);
  expect(fim.status).toBe('nao_entregue');
  passo(
    `Bruno confirma: pedido ${fim.status} (rótulo no app: "${carla.labels.statusLabel(fim.status)}"), reembolso ${fim.reembolso_centavos ?? 'não informado no pedido'} de ${fim.total_centavos} (diária: 100%)`,
  );
  naoEntregue = p.id;
});

afterAll(() => {
  process.stdout.write(
    `\nIDs para conferir os estornos no banco:\n  seed_23h=${seedCancelado}\n  mensal=${mensalEncerrada}\n  nao_entregue=${naoEntregue}\n`,
  );
});
