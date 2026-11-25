import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';

import { pedidosApi, type PedidoIn } from './api';
import { isPendente } from './labels';

function usePath() {
  const v = useActiveVinculo();
  if (!v.unidade_id) throw new Error('Pedidos exigem um vínculo com unidade.');
  return { condominio_id: v.condominio_id, unidade_id: v.unidade_id };
}

export const pedidosKey = (condominio_id: string, unidade_id: string) => ['pedidos', condominio_id, unidade_id];

export function usePedidos() {
  const path = usePath();
  return useQuery({
    queryKey: pedidosKey(path.condominio_id, path.unidade_id),
    queryFn: () => pedidosApi.list(path),
  });
}

/** Enquanto o pedido espera o dono ou o Pix, consulta de novo a cada 15 s. */
export function usePedido(pedidoId: string) {
  const path = usePath();
  return useQuery({
    queryKey: [...pedidosKey(path.condominio_id, path.unidade_id), pedidoId],
    queryFn: () => pedidosApi.get(path, pedidoId),
    refetchInterval: (q) => (q.state.data && isPendente(q.state.data.status) ? 15_000 : false),
  });
}

export function useCriarPedido() {
  const path = usePath();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, key }: { body: PedidoIn; key: string }) => pedidosApi.criar(path, body, key),
    onSuccess: () => qc.invalidateQueries({ queryKey: pedidosKey(path.condominio_id, path.unidade_id) }),
  });
}

/**
 * Cancelar pedido. A rota ainda não existe no backend (etapa 6 dele): enquanto
 * não estiver no OpenAPI, `disponivel` é falso e o botão aparece desabilitado.
 * Quando a rota entrar, `gen:api` + implementar `cancelar` aqui (só aqui).
 */
export function useCancelarPedido(): { disponivel: false } {
  return { disponivel: false };
}
