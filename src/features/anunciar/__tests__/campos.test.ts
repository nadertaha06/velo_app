import { centavosParaTexto, parseData, periodoDeDias, reaisParaCentavos } from '../campos';

describe('preço em reais → centavos (sem float)', () => {
  it.each([
    ['25', 2500],
    ['25,5', 2550],
    ['25,50', 2550],
    ['R$ 1.250,00', 125000],
    ['0,01', 1],
    ['25.50', 2550],
    ['1.250', 125000],
  ])('%s → %i', (t, c) => expect(reaisParaCentavos(t)).toBe(c));

  it.each(['', '0', '0,00', '25,505', 'abc', '-3', '1.2.3,00x'])('inválido: %s', (t) =>
    expect(reaisParaCentavos(t)).toBeNull(),
  );

  it('volta para o campo', () => {
    expect(centavosParaTexto(2550)).toBe('25,50');
    expect(centavosParaTexto(7)).toBe('0,07');
    expect(centavosParaTexto(null)).toBe('');
  });
});

describe('datas da disponibilidade (São Paulo)', () => {
  it('aceita só data de calendário', () => {
    expect(parseData('31/12/2026')).toEqual({ year: 2026, month: 12, day: 31 });
    expect(parseData('31/02/2026')).toBeNull();
    expect(parseData('2026-12-31')).toBeNull();
  });

  it('de um dia ao outro, inclusive, em UTC', () => {
    expect(periodoDeDias('01/12/2026', '31/12/2026')).toEqual({
      inicio: '2026-12-01T03:00:00.000Z',
      fim: '2027-01-01T03:00:00.000Z',
    });
    expect(periodoDeDias('05/12/2026', '05/12/2026')).toEqual({
      inicio: '2026-12-05T03:00:00.000Z',
      fim: '2026-12-06T03:00:00.000Z',
    });
  });

  it('fim antes do início é recusado', () => {
    expect(periodoDeDias('10/12/2026', '09/12/2026')).toBeNull();
  });
});
