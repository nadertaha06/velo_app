import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type PedidoFeito = components['schemas']['PedidoFeitoOut'];
export type PedidoIn = components['schemas']['PedidoIn'];
export type PedidoRecebido = components['schemas']['PedidoRecebidoOut'];

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
  /** Quem fez o pedido cancela (backend D72). Outro morador da unidade recebe 404. */
  cancelar(path: Path, pedido_id: string) {
    return unwrap(
      api.POST('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos/{pedido_id}/cancelar', {
        params: { path: { ...path, pedido_id } },
      }),
    );
  },
  /** O responsável da unidade dona cancela uma reserva confirmada (backend D72). Tela na etapa 3. */
  cancelarRecebido(path: Path, pedido_id: string) {
    return unwrap(
      api.POST('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos-recebidos/{pedido_id}/cancelar', {
        params: { path: { ...path, pedido_id } },
      }),
    );
  },
  get(path: Path, pedido_id: string) {
    return unwrap(
      api.GET('/condominios/{condominio_id}/unidades/{unidade_id}/pedidos/{pedido_id}', {
        params: { path: { ...path, pedido_id } },
      }),
    );
  },
};
