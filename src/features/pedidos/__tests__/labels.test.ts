import { isPendente, quantidadeLabel, statusLabel, statusTone } from '../labels';

it('quantidadeLabel', () => {
  expect(quantidadeLabel('dia', 1)).toBe('1 diária');
  expect(quantidadeLabel('dia', 3)).toBe('3 diárias');
  expect(quantidadeLabel('mes', 2)).toBe('2 meses');
  expect(quantidadeLabel('outra', 2)).toBe('2 × outra');
});

it('status', () => {
  expect(statusLabel('aguardando_dono')).toBe('Aguardando resposta');
  expect(statusLabel('novo_estado')).toBe('novo_estado');
  expect(statusTone('confirmado')).toBe('ink');
  expect(isPendente('aguardando_pix')).toBe(true);
  expect(isPendente('confirmado')).toBe(false);
});

it('status novos do backend (D71, D78)', () => {
  expect(statusLabel('processando_pagamento')).toBe('Processando pagamento');
  expect(isPendente('processando_pagamento')).toBe(true);
  expect(statusTone('processando_pagamento')).toBe('lime');
  expect(statusLabel('nao_entregue')).toBe('Vaga não entregue');
  expect(statusTone('nao_entregue')).toBe('danger');
  expect(isPendente('nao_entregue')).toBe(false);
});
