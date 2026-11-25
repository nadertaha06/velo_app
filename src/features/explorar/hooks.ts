import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';

import { vagasApi } from './api';
import type { Modalidade } from '@/features/pedidos/labels';

export function useVagas() {
  const { condominio_id } = useActiveVinculo();
  return useQuery({
    queryKey: ['vagas', condominio_id],
    queryFn: () => vagasApi.list(condominio_id),
  });
}

export function useVaga(vagaId: string) {
  const { condominio_id } = useActiveVinculo();
  return useQuery({
    queryKey: ['vaga', condominio_id, vagaId],
    queryFn: () => vagasApi.get(condominio_id, vagaId),
  });
}

/** Cotação do backend: preço, fim do período e sugestão mais barata vêm daqui (spec, seção 4). */
export function useCotacao(
  vagaId: string,
  params: { modalidade: Modalidade; quantidade: number; inicio: string },
  enabled: boolean,
) {
  const { condominio_id } = useActiveVinculo();
  return useQuery({
    queryKey: ['cotacao', condominio_id, vagaId, params.modalidade, params.quantidade, params.inicio],
    queryFn: () => vagasApi.cotacao(condominio_id, vagaId, params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
