import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUnidadePath } from '@/features/recebidos/hooks';
import { enviarParaUrlAssinada, type FotoPronta } from '@/lib/foto';

import { anunciarApi, type VagaIn, type VagaPatch } from './api';

export const vagaGestaoKey = (vagaId: string) => ['vaga-gestao', vagaId];

export function useVagaGestao(vagaId: string | null) {
  const path = useUnidadePath();
  return useQuery({
    queryKey: vagaGestaoKey(vagaId ?? 'nova'),
    queryFn: () => anunciarApi.get(path, vagaId!),
    enabled: !!vagaId,
  });
}

function useAtualizar() {
  const qc = useQueryClient();
  return (vagaId: string) => {
    void qc.invalidateQueries({ queryKey: vagaGestaoKey(vagaId) });
    void qc.invalidateQueries({ queryKey: ['unidade'] });
    void qc.invalidateQueries({ queryKey: ['vagas'] });
  };
}

/** Cria (POST) ou edita (PATCH). A resposta já é a vaga atualizada. */
export function useSalvarVaga() {
  const path = useUnidadePath();
  const qc = useQueryClient();
  const atualizar = useAtualizar();
  return useMutation({
    mutationFn: (v: { vagaId: string | null; body: VagaIn | VagaPatch }) =>
      v.vagaId ? anunciarApi.editar(path, v.vagaId, v.body as VagaPatch) : anunciarApi.criar(path, v.body as VagaIn),
    onSuccess: (vaga) => {
      qc.setQueryData(vagaGestaoKey(vaga.id), vaga);
      atualizar(vaga.id);
    },
  });
}

export function useDisponibilidade(vagaId: string) {
  const path = useUnidadePath();
  const atualizar = useAtualizar();
  const add = useMutation({
    mutationFn: (p: { inicio: string; fim: string }) => anunciarApi.addDisponibilidade(path, vagaId, p),
    onSuccess: () => atualizar(vagaId),
  });
  const remover = useMutation({
    mutationFn: (id: string) => anunciarApi.removerDisponibilidade(path, vagaId, id),
    onSuccess: () => atualizar(vagaId),
  });
  return { add, remover };
}

/**
 * Foto da vaga: pede a URL assinada (com o aviso confirmado), envia o JPEG e pede
 * o processamento, que tira o EXIF e valida a imagem (backend D49). A resposta diz
 * se a foto ficou válida ou foi recusada.
 */
export function useFotos(vagaId: string) {
  const path = useUnidadePath();
  const atualizar = useAtualizar();
  const enviar = useMutation({
    mutationFn: async (foto: FotoPronta) => {
      const up = await anunciarApi.pedirUpload(path, vagaId, foto.size);
      await enviarParaUrlAssinada(up, foto);
      return anunciarApi.concluirFoto(path, vagaId, up.foto.id);
    },
    onSettled: () => atualizar(vagaId),
  });
  const remover = useMutation({
    mutationFn: (fotoId: string) => anunciarApi.removerFoto(path, vagaId, fotoId),
    onSuccess: () => atualizar(vagaId),
  });
  return { enviar, remover };
}
