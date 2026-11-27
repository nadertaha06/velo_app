import { render, screen } from '@testing-library/react-native';

import type { PedidoFeito } from '../api';
import { usePedidos } from '../hooks';
import { ReservasScreen } from '../ReservasScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/features/vinculo/useActiveVinculo', () => ({
  useActiveVinculo: () => ({ condominio_id: 'c1', unidade_id: 'u1', papel: 'membro' }),
}));
jest.mock('../hooks', () => ({ usePedidos: jest.fn() }));

const p = (id: string, numero: string, feito_por_mim: boolean, extra: Partial<PedidoFeito> = {}) =>
  ({
    id,
    status: 'confirmado',
    vaga: { id: `v${id}`, numero, andar: 'S1' },
    inicio: '2099-11-12T21:00:00Z',
    fim: '2099-11-13T21:00:00Z',
    total_centavos: 2500,
    feito_por_mim,
    estorno_status: null,
    ...extra,
  }) as PedidoFeito;

describe('ReservasScreen', () => {
  it('separa os meus pedidos dos de outros moradores (feito_por_mim) e mostra o estorno', async () => {
    (usePedidos as jest.Mock).mockReturnValue({
      data: [p('1', '47', true), p('2', '12', false, { status: 'cancelado', estorno_status: 'em_analise' })],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    await render(<ReservasScreen />);
    expect(screen.getByText('Meus pedidos')).toBeOnTheScreen();
    expect(screen.getByText('De outros moradores da unidade')).toBeOnTheScreen();
    expect(screen.getByText('Reembolso em análise')).toBeOnTheScreen();
  });
});
