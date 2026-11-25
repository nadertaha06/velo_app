import { formatCents, formatDateTime, toApiInstant } from '../format';

const nbsp = (s: string) => s.replace(/ /g, ' ');

describe('formatCents', () => {
  it('formata centavos inteiros em reais', () => {
    expect(nbsp(formatCents(123456))).toBe('R$ 1.234,56');
    expect(nbsp(formatCents(5))).toBe('R$ 0,05');
  });

  it('recusa valor não inteiro', () => {
    expect(() => formatCents(10.5)).toThrow();
  });
});

describe('datas', () => {
  it('exibe no fuso de São Paulo', () => {
    // 02:30 UTC = 23:30 do dia anterior em São Paulo (UTC−3)
    expect(formatDateTime('2026-03-10T02:30:00Z')).toBe('09/03/2026, 23:30');
  });

  it('envia em UTC ISO 8601', () => {
    expect(toApiInstant(new Date(Date.UTC(2026, 0, 2, 3, 4, 5)))).toBe('2026-01-02T03:04:05.000Z');
  });
});
