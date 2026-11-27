import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';
import { pollInterval } from '@/features/pedidos/hooks';

import { recebidosApi } from './api';

export function useUnidadePath() {
  const v = useActiveVinculo();
  if (!v.unidade_id) throw new Error('Exige um vínculo com unidade.');
  return { condominio_id: v.condominio_id, unidade_id: v.unidade_id };
}

export const recebidosKey = (c: string, u: string) => ['recebidos', c, u];

export function useRecebidos() {
  const path = useUnidadePath();
  return useQuery({
    queryKey: recebidosKey(path.condominio_id, path.unidade_id),
    queryFn: () => recebidosApi.list(path),
    // Pedido novo pode chegar a qualquer momento (ainda sem push): consulta a cada 15 s.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  });
}

export function useRecebido(pedidoId: string) {
  const path = useUnidadePath();
  return useQuery({
    queryKey: [...recebidosKey(path.condominio_id, path.unidade_id), pedidoId],
    queryFn: () => recebidosApi.get(path, pedidoId),
    refetchInterval: (q) => pollInterval(q.state.data),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  });
}

export type AcaoRecebido = 'aprovar' | 'recusar' | 'cancelar';

/** Uma mutação por ação; a resposta (pedido atualizado) entra direto no cache. */
export function useAcaoRecebido(pedidoId: string, acao: AcaoRecebido) {
  const path = useUnidadePath();
  const qc = useQueryClient();
  const key = recebidosKey(path.condominio_id, path.unidade_id);
  return useMutation({
    mutationFn: () => recebidosApi[acao](path, pedidoId),
    onSuccess: (pedido) => {
      qc.setQueryData([...key, pedidoId], pedido);
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}
