import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type PedidoFeito = components['schemas']['PedidoFeitoOut'];
export type PedidoIn = components['schemas']['PedidoIn'];

type Path = { condominio_id: string; unidade_id: string };

export const pedidosApi = {
  /** `idempotencyKey` é a mesma em todas as tentativas do mesmo envio (backend, D65). */
  criar(path: Path, body: PedidoIn, idempotencyKey: string) {
    return unwrap(
      api.POST('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos', {
        params: { path, header: { 'Idempotency-Key': idempotencyKey } },
        body,
      }),
    );
  },
  list(path: Path) {
    return unwrap(api.GET('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos', { params: { path } }));
  },
  get(path: Path, pedido_id: string) {
    return unwrap(
      api.GET('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos/{pedido_id}', {
        params: { path: { ...path, pedido_id } },
      }),
    );
  },
};
