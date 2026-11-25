import { render, screen } from '@testing-library/react-native';

import { Countdown } from '@/components/Countdown';

import { recordServerDate, resetServerClock, serverNow, serverOffsetMs } from '../serverClock';

afterEach(() => {
  resetServerClock();
  jest.useRealTimers();
});

describe('serverClock', () => {
  it('calcula a diferença entre o servidor e o aparelho pelo cabeçalho Date', () => {
    // Aparelho 10 min adiantado: o servidor diz 12:00:00, o aparelho acha que é 12:10:00.
    const device = Date.parse('2026-11-25T12:10:00Z');
    recordServerDate('Wed, 25 Nov 2026 12:00:00 GMT', device - 100, device + 100);
    expect(serverOffsetMs()).toBe(-600_000 + 500);
  });

  it('ignora cabeçalho ausente ou inválido', () => {
    recordServerDate(null, 0, 0);
    recordServerDate('não é data', 0, 0);
    expect(serverOffsetMs()).toBe(0);
  });

  it('o contador usa a hora do servidor, não a do aparelho', async () => {
    jest.useFakeTimers();
    // Aparelho 1 h atrasado em relação ao servidor.
    jest.setSystemTime(Date.parse('2026-11-25T11:00:00Z'));
    recordServerDate('Wed, 25 Nov 2026 12:00:00 GMT', Date.now(), Date.now());
    // Prazo (do backend) às 12:30 do servidor: faltam ~30 min, não 1h30.
    await render(<Countdown ate="2026-11-25T12:30:00Z" now={serverNow} />);
    expect(screen.getByText('29min')).toBeOnTheScreen();
  });
});
