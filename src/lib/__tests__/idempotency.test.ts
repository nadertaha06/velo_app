import { renderHook } from '@testing-library/react-native';

import { useIdempotencyKey } from '../useIdempotencyKey';

const base = {
  vagaId: 'v1',
  veiculoId: 'c1',
  modalidade: 'dia',
  quantidade: 3,
  inicio: '2099-11-12T21:00:00.000Z',
  metodo: 'pix',
};

describe('useIdempotencyKey', () => {
  it('mesma chave nas novas tentativas do mesmo envio', async () => {
    const { result, rerender } = await renderHook((c: typeof base) => useIdempotencyKey(c), { initialProps: base });
    const first = result.current;
    expect(first).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
    await rerender({ ...base });
    await rerender({ ...base });
    expect(result.current).toBe(first);
  });

  it('a ordem das chaves do objeto não importa', async () => {
    const { result, rerender } = await renderHook((c: Record<string, unknown>) => useIdempotencyKey(c), {
      initialProps: base,
    });
    const first = result.current;
    const { metodo, ...resto } = base;
    await rerender({ metodo, ...resto });
    expect(result.current).toBe(first);
  });

  it.each([
    ['período (início)', { inicio: '2099-11-13T21:00:00.000Z' }],
    ['período (quantidade)', { quantidade: 4 }],
    ['veículo', { veiculoId: 'c2' }],
    ['modalidade', { modalidade: 'semana' }],
    ['vaga', { vagaId: 'v2' }],
    ['forma de pagamento', { metodo: 'cartao' }],
  ])('chave nova se mudar %s', async (_n, mudanca) => {
    const { result, rerender } = await renderHook((c: typeof base) => useIdempotencyKey(c), { initialProps: base });
    const first = result.current;
    await rerender({ ...base, ...mudanca });
    expect(result.current).not.toBe(first);
    // e volta a ficar estável depois da mudança
    const second = result.current;
    await rerender({ ...base, ...mudanca });
    expect(result.current).toBe(second);
  });
});
