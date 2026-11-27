import { formatDate } from '@/lib/format';

import type { VagaGestao } from './api';

/** Situação da vaga para o responsável. `no_ar` e a suspensão vêm do backend. */
export function vagaSituacao(v: Pick<VagaGestao, 'ativa' | 'no_ar' | 'suspensa_ate'>): {
  label: string;
  tone: 'lime' | 'neutral' | 'danger';
  detalhe: string | null;
} {
  if (v.suspensa_ate) {
    return {
      label: 'Suspensa',
      tone: 'danger',
      detalhe: `Suspensa até ${formatDate(v.suspensa_ate)} por cancelamentos do dono.`,
    };
  }
  if (!v.ativa) return { label: 'Pausada', tone: 'neutral', detalhe: 'Você pausou o anúncio.' };
  if (v.no_ar) return { label: 'No ar', tone: 'lime', detalhe: null };
  return {
    label: 'Fora do ar',
    tone: 'neutral',
    detalhe: 'Ainda não aparece para os vizinhos: confira preços, disponibilidade e a conta de recebimento.',
  };
}
