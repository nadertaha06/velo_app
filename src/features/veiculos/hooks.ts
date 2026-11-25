import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { veiculosApi, type VeiculoIn } from './api';

export const veiculosKey = ['veiculos'] as const;

export function useVeiculos() {
  return useQuery({ queryKey: veiculosKey, queryFn: veiculosApi.list });
}

export function useCriarVeiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: VeiculoIn) => veiculosApi.criar(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: veiculosKey }),
  });
}
