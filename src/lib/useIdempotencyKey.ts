import { useMemo } from 'react';

import { idempotencyKey } from './randomId';

/**
 * Chave de idempotência de um envio. Fica a mesma enquanto o conteúdo não muda
 * (novas tentativas do mesmo envio); muda quando muda qualquer campo do conteúdo.
 * Sem isso o backend responderia `idempotency_key_reused` (D65 dele).
 */
export function useIdempotencyKey(conteudo: Record<string, unknown>): string {
  const assinatura = JSON.stringify(conteudo, Object.keys(conteudo).sort());
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a chave depende só da assinatura.
  return useMemo(() => idempotencyKey(), [assinatura]);
}
