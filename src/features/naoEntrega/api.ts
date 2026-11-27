import { api, unwrap } from '@/api/client';
import { isApiError } from '@/api/errors';
import type { components } from '@/api/schema';

export type AvisoNaoEntrega = components['schemas']['DenunciaNaoEntregaOut'];
export type AvisoNaoEntregaIn = components['schemas']['DenunciaNaoEntregaIn'];

type Path = { condominio_id: string; unidade_id: string };
const FEITO = '/condominios/{condominio_id}/unidades/{unidade_id}/pedidos/{pedido_id}/vaga-indisponivel' as const;
const RECEBIDO = '/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos/{pedido_id}/vaga-indisponivel' as const;

/** 404 aqui quer dizer "não há aviso para esse pedido". */
async function ouNada<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    if (isApiError(err, 'not_found')) return null;
    throw err;
  }
}

/** Vaga não entregue (backend D78): quem alugou avisa; o responsável confirma ou contesta. */
export const naoEntregaApi = {
  doPedidoFeito(path: Path, pedido_id: string) {
    return ouNada(unwrap(api.GET(FEITO, { params: { path: { ...path, pedido_id } } })));
  },
  avisar(path: Path, pedido_id: string, body: AvisoNaoEntregaIn) {
    return unwrap(api.POST(FEITO, { params: { path: { ...path, pedido_id } }, body }));
  },
  concluirFoto(path: Path, pedido_id: string) {
    return unwrap(api.POST(`${FEITO}/foto/concluir`, { params: { path: { ...path, pedido_id } } }));
  },
  doPedidoRecebido(path: Path, pedido_id: string) {
    return ouNada(unwrap(api.GET(RECEBIDO, { params: { path: { ...path, pedido_id } } })));
  },
  confirmar(path: Path, pedido_id: string) {
    return unwrap(api.POST(`${RECEBIDO}/confirmar`, { params: { path: { ...path, pedido_id } } }));
  },
  contestar(path: Path, pedido_id: string, texto: string) {
    return unwrap(api.POST(`${RECEBIDO}/contestar`, { params: { path: { ...path, pedido_id } }, body: { texto } }));
  },
};

/** Estados em que o pedido pode ter (ou ganhar) um aviso: vale consultar. */
export function podeTerAviso(status: string): boolean {
  return ['confirmado', 'em_uso', 'nao_entregue', 'concluido'].includes(status);
}

/** Quem alugou só avisa durante a reserva paga; a janela exata o backend confere. */
export function podeAvisar(status: string): boolean {
  return status === 'confirmado' || status === 'em_uso';
}

export function avisoAberto(a: AvisoNaoEntrega | null | undefined): boolean {
  return !!a && (a.status === 'aguardando_dono' || a.status === 'aguardando_admin');
}
