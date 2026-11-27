import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUnidadePath } from '@/features/recebidos/hooks';
import { enviarParaUrlAssinada, type FotoPronta } from '@/lib/foto';

import { naoEntregaApi } from './api';

type Lado = 'feito' | 'recebido';

const avisoKey = (lado: Lado, pedidoId: string) => ['aviso-nao-entrega', lado, pedidoId];

/** Aviso do pedido (ou `null`), consultado só quando o estado permite ter um. */
export function useAviso(lado: Lado, pedidoId: string, enabled: boolean) {
  const path = useUnidadePath();
  return useQuery({
    queryKey: avisoKey(lado, pedidoId),
    queryFn: () =>
      lado === 'feito' ? naoEntregaApi.doPedidoFeito(path, pedidoId) : naoEntregaApi.doPedidoRecebido(path, pedidoId),
    enabled,
    // Enquanto espera o dono, o prazo é curto: acompanha.
    refetchInterval: (q) => (q.state.data?.status === 'aguardando_dono' ? 15_000 : false),
    refetchIntervalInBackground: false,
  });
}

function useInvalidar(lado: Lado, pedidoId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: avisoKey(lado, pedidoId) });
    void qc.invalidateQueries({ queryKey: lado === 'feito' ? ['pedidos'] : ['recebidos'] });
  };
}

/**
 * Quem alugou avisa. Com foto: o backend devolve a URL assinada; o app envia o
 * JPEG e pede o processamento. Se a foto falhar, o aviso já existe e vale sem ela.
 */
export function useAvisar(pedidoId: string) {
  const path = useUnidadePath();
  const invalidar = useInvalidar('feito', pedidoId);
  return useMutation({
    mutationFn: async (v: { desde: string; relato: string | null; foto: FotoPronta | null }) => {
      const criado = await naoEntregaApi.avisar(path, pedidoId, {
        desde: v.desde,
        relato: v.relato,
        foto: v.foto ? { content_type: v.foto.contentType, size_bytes: v.foto.size } : null,
      });
      let fotoFalhou = false;
      if (v.foto && criado.foto_upload) {
        try {
          await enviarParaUrlAssinada(criado.foto_upload, v.foto);
          await naoEntregaApi.concluirFoto(path, pedidoId);
        } catch {
          fotoFalhou = true;
        }
      }
      return { aviso: criado, fotoFalhou };
    },
    onSuccess: invalidar,
  });
}

export function useResponderAviso(pedidoId: string) {
  const path = useUnidadePath();
  const invalidar = useInvalidar('recebido', pedidoId);
  return useMutation({
    mutationFn: (v: { acao: 'confirmar' } | { acao: 'contestar'; texto: string }) =>
      v.acao === 'confirmar'
        ? naoEntregaApi.confirmar(path, pedidoId)
        : naoEntregaApi.contestar(path, pedidoId, v.texto),
    onSuccess: invalidar,
  });
}
