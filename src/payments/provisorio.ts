import { Platform } from 'react-native';

import { randomId } from '@/lib/randomId';

import { PagamentoIndisponivelError, type MetodoPagamento, type PaymentProvider } from './types';

/**
 * Provedor provisório, até o backend ter o gateway real (spec do app, seção 4).
 *
 * - Pix: não precisa de nada do app.
 * - Cartão e Apple Pay: sem SDK, não há token de verdade. Em dev, gera um token
 *   de mentira que o `FakeGateway` do backend aceita, só para exercitar o fluxo.
 *   Fora de dev, o método aparece desabilitado ("em breve").
 */
export function createProvisorioProvider(isDev: boolean, os: string): PaymentProvider {
  const cartaoOk = isDev;
  return {
    metodos() {
      const base: MetodoPagamento[] = ['cartao', 'pix'];
      return os === 'ios' ? ['apple_pay', ...base] : base;
    },
    disponivel(metodo) {
      return metodo === 'pix' || cartaoOk;
    },
    async preparar(metodo) {
      if (metodo === 'pix') return { forma_pagamento: 'pix' };
      if (!cartaoOk) throw new PagamentoIndisponivelError();
      return { forma_pagamento: 'cartao', cartao_token: `tok_dev_${randomId(24)}` };
    },
  };
}

export const paymentProvider = createProvisorioProvider(__DEV__, Platform.OS);
