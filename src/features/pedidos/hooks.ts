import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';

import { pedidosApi, type PedidoFeito, type PedidoIn } from './api';
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

export const POLL_MS = 15_000;

/** Intervalo de consulta: só enquanto o pedido espera o dono ou o Pix; em status final, para. */
export function pollInterval(pedido: Pick<PedidoFeito, 'status'> | undefined): number | false {
  return pedido && isPendente(pedido.status) ? POLL_MS : false;
}

/**
 * Pedido em acompanhamento. Consulta de novo a cada 15 s enquanto pendente.
 * Em segundo plano o intervalo para (`setupAppFocus`), e ao voltar busca na hora.
 */
export function usePedido(pedidoId: string) {
  const path = usePath();
  return useQuery({
    queryKey: [...pedidosKey(path.condominio_id, path.unidade_id), pedidoId],
    queryFn: () => pedidosApi.get(path, pedidoId),
    refetchInterval: (q) => pollInterval(q.state.data),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
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

/** Estados em que quem alugou pode cancelar (backend D72). */
export function podeCancelar(status: string): boolean {
  return ['aguardando_dono', 'aguardando_pix', 'confirmado', 'em_uso'].includes(status);
}

/**
 * Quem fez o pedido cancela. O reembolso é decidido e devolvido pelo backend
 * (`reembolso_centavos`); o app não calcula (D72 do backend, D11 do app).
 */
export function useCancelarPedido(pedidoId: string) {
  const path = usePath();
  const qc = useQueryClient();
  const key = pedidosKey(path.condominio_id, path.unidade_id);
  return useMutation({
    mutationFn: () => pedidosApi.cancelar(path, pedidoId),
    onSuccess: (pedido) => {
      qc.setQueryData([...key, pedidoId], pedido);
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}
