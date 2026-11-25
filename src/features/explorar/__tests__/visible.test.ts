import type { VagaAnuncio } from '../api';
import { inicioPadrao } from '../FiltroProvider';
import { visibleVagas } from '../visible';

const vaga = (id: string, over: Partial<VagaAnuncio> = {}): VagaAnuncio => ({
  id,
  numero: id,
  andar: 'S1',
  coberta: true,
  largura_cm: 250,
  comprimento_cm: 500,
  altura_cm: 210,
  porte_maximo: 'M',
  precos: { dia: 2500, semana: null, mes: null, ano: null },
  modo_aprovacao: 'manual',
  prazo_resposta_horas: 4,
  dono: { primeiro_nome: 'Ana', bloco: 'A', numero: '101' },
  da_minha_unidade: false,
  disponibilidades: [],
  fotos: [],
  ...over,
});

describe('visibleVagas', () => {
  it('esconde as da minha unidade e as sem a modalidade', () => {
    const lista = [vaga('1'), vaga('2', { da_minha_unidade: true }), vaga('3', { precos: { dia: null, semana: 9000, mes: null, ano: null } })];
    expect(visibleVagas(lista, 'dia').map((v) => v.id)).toEqual(['1']);
    expect(visibleVagas(lista, 'semana').map((v) => v.id)).toEqual(['3']);
  });

  it('não filtra porte (regra do backend)', () => {
    expect(visibleVagas([vaga('1', { porte_maximo: 'P' })], 'dia')).toHaveLength(1);
  });
});

it('inicioPadrao: próxima hora cheia + 1, no futuro', () => {
  const now = Date.parse('2026-11-25T14:20:00Z');
  expect(inicioPadrao(now)).toBe('2026-11-25T16:00:00.000Z');
});
