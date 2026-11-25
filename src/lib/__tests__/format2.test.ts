import { addLocalDays, formatDuration, formatMeters, fromLocalParts, localParts } from '../format';

describe('fuso de São Paulo', () => {
  it('converte hora de parede em SP para UTC', () => {
    expect(fromLocalParts({ year: 2026, month: 11, day: 12, hour: 18, minute: 0 }).toISOString()).toBe(
      '2026-11-12T21:00:00.000Z',
    );
  });

  it('meia-noite em SP é 03:00 UTC do mesmo dia', () => {
    expect(fromLocalParts({ year: 2026, month: 1, day: 1, hour: 0, minute: 0 }).toISOString()).toBe(
      '2026-01-01T03:00:00.000Z',
    );
  });

  it('localParts e fromLocalParts são inversas', () => {
    const d = new Date('2026-07-31T02:30:00Z'); // 30/07 23:30 em SP
    const p = localParts(d);
    expect(p).toMatchObject({ year: 2026, month: 7, day: 30, hour: 23, minute: 30 });
    expect(fromLocalParts(p).toISOString()).toBe(d.toISOString());
  });

  it('addLocalDays vira mês e ano', () => {
    expect(addLocalDays({ year: 2026, month: 12, day: 31, hour: 9, minute: 0 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
      hour: 9,
      minute: 0,
    });
  });
});

describe('formatDuration', () => {
  it.each([
    [30_000, 'menos de 1 min'],
    [12 * 60_000, '12min'],
    [60 * 60_000, '1h'],
    [(3 * 60 + 42) * 60_000, '3h 42min'],
    [(26 * 60) * 60_000, '1d 2h'],
  ])('%d ms → %s', (ms, txt) => {
    expect(formatDuration(ms)).toBe(txt);
  });
});

it('formatMeters', () => {
  expect(formatMeters(250)).toBe('2,5');
  expect(formatMeters(231)).toBe('2,31');
});
