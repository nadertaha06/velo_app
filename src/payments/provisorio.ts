import { Platform } from 'react-native';

import { PagamentoIndisponivelError, type MetodoPagamento, type PaymentProvider } from './types';

/**
 * Provedor provisório, até o backend ter o gateway real (spec do app, seção 4).
 *
 * - Pix: não precisa de nada do app.
 * - Cartão e Apple Pay: sem SDK, não há token de verdade. No build de dev
 *   (`__DEV__`), gera um token de mentira que o `FakeGateway` aceita.
 *   No build de produção o método aparece desabilitado ("em breve") e o gerador
 *   do token nem entra no bundle.
 */
export function createProvisorioProvider(
  os: string,
  makeToken: (() => string) | null,
): PaymentProvider {
  return {
    metodos() {
      const base: MetodoPagamento[] = ['cartao', 'pix'];
      return os === 'ios' ? ['apple_pay', ...base] : base;
    },
    disponivel(metodo) {
      return metodo === 'pix' || makeToken !== null;
    },
    async preparar(metodo) {
      if (metodo === 'pix') return { forma_pagamento: 'pix' };
      if (!makeToken) throw new PagamentoIndisponivelError();
      return { forma_pagamento: 'cartao', cartao_token: makeToken() };
    },
  };
}

/**
 * Flag de BUILD: `__DEV__` é trocado por uma constante pelo Metro na hora do
 * bundle. No build de produção vira `false`, e o ramo abaixo, com o `require`
 * de `devToken`, sai do bundle. Precisa ser o `__DEV__` literal neste `if`: uma
 * constante importada de outro módulo não é eliminada. Não vem de variável de
 * runtime nem da API. Prova: `npm run test:prod-bundle` (D10).
 */
function tokenDeDev(): (() => string) | null {
  if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional ao build.
    return (require('./devToken') as typeof import('./devToken')).devCardToken;
  }
  return null;
}

export const paymentProvider = createProvisorioProvider(Platform.OS, tokenDeDev());
