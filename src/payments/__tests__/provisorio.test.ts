import { idempotencyKey } from '@/lib/randomId';

import { devCardToken } from '../devToken';
import { quandoCobra } from '../labels';
import { createProvisorioProvider, paymentProvider } from '../provisorio';
import { PagamentoIndisponivelError } from '../types';

describe('provedor provisório', () => {
  it('Apple Pay só no iOS', () => {
    expect(createProvisorioProvider('ios', devCardToken).metodos()).toEqual(['apple_pay', 'cartao', 'pix']);
    expect(createProvisorioProvider('android', devCardToken).metodos()).toEqual(['cartao', 'pix']);
  });

  it('Pix não leva token', async () => {
    await expect(createProvisorioProvider('ios', null).preparar('pix')).resolves.toEqual({ forma_pagamento: 'pix' });
  });

  it('com o gerador de dev, cartão leva token de mentira no formato do backend', async () => {
    const d = await createProvisorioProvider('ios', devCardToken).preparar('apple_pay');
    expect(d.forma_pagamento).toBe('cartao');
    expect(d.cartao_token).toMatch(/^tok_dev_[A-Za-z0-9]{24}$/);
    expect(d.cartao_token).toMatch(/^[A-Za-z][A-Za-z0-9_-]{7,255}$/);
  });

  it('sem o gerador (build de produção), cartão nunca leva token: fica indisponível', async () => {
    const p = createProvisorioProvider('ios', null);
    expect(p.disponivel('cartao')).toBe(false);
    expect(p.disponivel('apple_pay')).toBe(false);
    expect(p.disponivel('pix')).toBe(true);
    await expect(p.preparar('cartao')).rejects.toBeInstanceOf(PagamentoIndisponivelError);
    await expect(p.preparar('apple_pay')).rejects.toBeInstanceOf(PagamentoIndisponivelError);
  });

  it('no build de dev (jest roda com __DEV__ = true), o provedor exportado tem cartão', () => {
    // A prova de que o build de PRODUÇÃO não leva o token é o `npm run test:prod-bundle`,
    // que gera o bundle real e procura o token nele.
    expect(__DEV__).toBe(true);
    expect(paymentProvider.disponivel('cartao')).toBe(true);
  });
});

describe('textos de cobrança', () => {
  it('manual: cartão reserva, Pix não cobra antes', () => {
    expect(quandoCobra('apple_pay', false, 'Rafael')).toMatch(/só é cobrado quando Rafael aprovar/);
    expect(quandoCobra('pix', false, 'Rafael')).toMatch(/^Nada é cobrado agora/);
  });

  it('automática: cobra ao enviar', () => {
    expect(quandoCobra('cartao', true, 'Rafael')).toMatch(/cobrado ao enviar/);
  });
});

it('chave de idempotência no formato do backend', () => {
  const a = idempotencyKey();
  expect(a).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
  expect(idempotencyKey()).not.toBe(a);
});
