import { act, render, screen } from '@testing-library/react-native';

import { Countdown } from '../Countdown';

describe('Countdown', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('conta até zero e avisa uma vez', async () => {
    let t = Date.parse('2026-11-25T12:00:00Z');
    const now = () => t;
    const onFim = jest.fn();
    await render(<Countdown ate="2026-11-25T12:02:00Z" now={now} onFim={onFim} />);
    expect(screen.getByText('2min')).toBeOnTheScreen();

    await act(async () => {
      t += 120_000;
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Prazo encerrado')).toBeOnTheScreen();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(onFim).toHaveBeenCalledTimes(1);
  });

  it('prazo já vencido mostra encerrado sem contar', async () => {
    const onFim = jest.fn();
    await render(<Countdown ate="2026-01-01T00:00:00Z" now={() => Date.parse('2026-11-25T12:00:00Z')} onFim={onFim} />);
    expect(screen.getByText('Prazo encerrado')).toBeOnTheScreen();
    expect(onFim).not.toHaveBeenCalled();
  });
});
