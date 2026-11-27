import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUnidadePath } from '@/features/recebidos/hooks';

import { unidadeApi } from './api';

const k = (nome: string, c: string, u: string) => ['unidade', nome, c, u];

export function useMembros() {
  const p = useUnidadePath();
  return useQuery({ queryKey: k('membros', p.condominio_id, p.unidade_id), queryFn: () => unidadeApi.membros(p) });
}

export function useConvites() {
  const p = useUnidadePath();
  return useQuery({ queryKey: k('convites', p.condominio_id, p.unidade_id), queryFn: () => unidadeApi.convites(p) });
}

export function useVagasDaUnidade() {
  const p = useUnidadePath();
  return useQuery({ queryKey: k('vagas', p.condominio_id, p.unidade_id), queryFn: () => unidadeApi.vagas(p) });
}

export const vagasDaUnidadeKey = (c: string, u: string) => k('vagas', c, u);

export function useSubconta() {
  const p = useUnidadePath();
  return useQuery({ queryKey: k('subconta', p.condominio_id, p.unidade_id), queryFn: () => unidadeApi.subconta(p) });
}

function useInvalidarUnidade() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ['unidade'] });
}

export function useRemoverMembro() {
  const p = useUnidadePath();
  const invalidar = useInvalidarUnidade();
  return useMutation({ mutationFn: (vinculoId: string) => unidadeApi.removerMembro(p, vinculoId), onSuccess: invalidar });
}

export function useConvidar() {
  const p = useUnidadePath();
  const invalidar = useInvalidarUnidade();
  return useMutation({ mutationFn: (email: string | null) => unidadeApi.convidar(p, email), onSuccess: invalidar });
}

export function useReenviarConvite() {
  const p = useUnidadePath();
  const invalidar = useInvalidarUnidade();
  return useMutation({ mutationFn: (id: string) => unidadeApi.reenviar(p, id), onSuccess: invalidar });
}

export function useRevogarConvite() {
  const p = useUnidadePath();
  const invalidar = useInvalidarUnidade();
  return useMutation({ mutationFn: (id: string) => unidadeApi.revogar(p, id), onSuccess: invalidar });
}
