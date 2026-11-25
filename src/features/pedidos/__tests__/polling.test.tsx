import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { pedidosApi } from '../api';
import { pollInterval, POLL_MS, usePedido } from '../hooks';

jest.mock('@/features/vinculo/useActiveVinculo', () => ({
  useActiveVinculo: () => ({ condominio_id: 'c1', unidade_id: 'u1' }),
}));
jest.mock('../api', () => ({ pedidosApi: { get: jest.fn() } }));

const get = pedidosApi.get as jest.Mock;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

async function tick(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  get.mockReset();
  focusManager.setFocused(true);
});
afterEach(() => {
  focusManager.setFocused(undefined);
  jest.useRealTimers();
});

it('pollInterval: só em status pendente', () => {
  expect(pollInterval({ status: 'aguardando_dono' })).toBe(POLL_MS);
  expect(pollInterval({ status: 'aguardando_pix' })).toBe(POLL_MS);
  for (const s of ['confirmado', 'em_uso', 'concluido', 'recusado', 'expirado', 'cancelado']) {
    expect(pollInterval({ status: s })).toBe(false);
  }
  expect(pollInterval(undefined)).toBe(false);
});

it('consulta a cada 15 s enquanto pendente e para no status final', async () => {
  get
    .mockResolvedValueOnce({ id: 'p1', status: 'aguardando_dono' })
    .mockResolvedValueOnce({ id: 'p1', status: 'aguardando_dono' })
    .mockResolvedValue({ id: 'p1', status: 'confirmado' });
  await renderHook(() => usePedido('p1'), { wrapper });
  await tick(0);
  expect(get).toHaveBeenCalledTimes(1);
  await tick(POLL_MS);
  expect(get).toHaveBeenCalledTimes(2);
  await tick(POLL_MS);
  expect(get).toHaveBeenCalledTimes(3); // voltou "confirmado"
  await tick(POLL_MS * 4);
  expect(get).toHaveBeenCalledTimes(3); // parou
});

it('para em segundo plano e busca de novo ao voltar', async () => {
  get.mockResolvedValue({ id: 'p1', status: 'aguardando_dono' });
  await renderHook(() => usePedido('p1'), { wrapper });
  await tick(0);
  expect(get).toHaveBeenCalledTimes(1);

  await act(async () => focusManager.setFocused(false));
  await tick(POLL_MS * 4);
  expect(get).toHaveBeenCalledTimes(1); // nada em segundo plano

  await act(async () => focusManager.setFocused(true));
  await tick(0);
  expect(get).toHaveBeenCalledTimes(2); // buscou ao voltar
  await tick(POLL_MS);
  expect(get).toHaveBeenCalledTimes(3); // e retomou o intervalo
});
