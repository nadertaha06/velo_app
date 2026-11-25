import { idempotencyKey } from '@/lib/randomId';

import { quandoCobra } from '../labels';
import { createProvisorioProvider } from '../provisorio';
import { PagamentoIndisponivelError } from '../types';

describe('provedor provisório', () => {
  it('Apple Pay só no iOS', () => {
    expect(createProvisorioProvider(true, 'ios').metodos()).toEqual(['apple_pay', 'cartao', 'pix']);
    expect(createProvisorioProvider(true, 'android').metodos()).toEqual(['cartao', 'pix']);
  });

  it('Pix não leva token', async () => {
    await expect(createProvisorioProvider(false, 'ios').preparar('pix')).resolves.toEqual({ forma_pagamento: 'pix' });
  });

  it('em dev, cartão gera token de mentira no formato aceito pelo backend', async () => {
    const d = await createProvisorioProvider(true, 'ios').preparar('apple_pay');
    expect(d.forma_pagamento).toBe('cartao');
    expect(d.cartao_token).toMatch(/^tok_dev_[A-Za-z0-9]{24}$/);
    expect(d.cartao_token).toMatch(/^[A-Za-z][A-Za-z0-9_-]{7,255}$/);
  });

  it('fora de dev, cartão fica indisponível', async () => {
    const p = createProvisorioProvider(false, 'ios');
    expect(p.disponivel('cartao')).toBe(false);
    expect(p.disponivel('pix')).toBe(true);
    await expect(p.preparar('cartao')).rejects.toBeInstanceOf(PagamentoIndisponivelError);
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
