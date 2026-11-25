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
