import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type PedidoRecebido = components['schemas']['PedidoRecebidoOut'];

type Path = { condominio_id: string; unidade_id: string };
const BASE = '/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos/{pedido_id}' as const;

/** Pedidos da vaga da unidade. Aprovar, recusar e cancelar são só do responsável (backend). */
export const recebidosApi = {
  list(path: Path) {
    return unwrap(api.GET('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos', { params: { path } }));
  },
  get(path: Path, pedido_id: string) {
    return unwrap(api.GET(BASE, { params: { path: { ...path, pedido_id } } }));
  },
  aprovar(path: Path, pedido_id: string) {
    return unwrap(api.POST(`${BASE}/aprovar`, { params: { path: { ...path, pedido_id } } }));
  },
  recusar(path: Path, pedido_id: string) {
    return unwrap(api.POST(`${BASE}/recusar`, { params: { path: { ...path, pedido_id } } }));
  },
  /** O dono cancela uma reserva confirmada (backend D72): conta para a suspensão da vaga. */
  cancelar(path: Path, pedido_id: string) {
    return unwrap(api.POST(`${BASE}/cancelar`, { params: { path: { ...path, pedido_id } } }));
  },
};
