import { render, screen, within } from '@testing-library/react-native';

import type { PedidoRecebido } from '../api';
import { useRecebidos } from '../hooks';
import { esperaResposta, RecebidosScreen } from '../RecebidosScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useLocalSearchParams: () => ({}) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/features/vinculo/useActiveVinculo', () => ({
  useActiveVinculo: () => ({ condominio_id: 'c1', unidade_id: 'u1', papel: 'responsavel' }),
}));
jest.mock('@/features/naoEntrega/hooks', () => ({ useAviso: jest.fn(), useResponderAviso: jest.fn() }));
jest.mock('../hooks', () => ({ useRecebidos: jest.fn() }));

const p = (id: string, extra: Partial<PedidoRecebido>) =>
  ({
    id,
    status: 'em_uso',
    vaga: { id: 'v1', numero: '47', andar: 'S1' },
    inicio: '2099-11-12T21:00:00Z',
    fim: '2099-11-15T21:00:00Z',
    valor_dono_centavos: 7125,
    prazo_resposta_em: null,
    estorno_status: null,
    aviso_nao_entregue_aberto: false,
    aviso_prazo_ate: null,
    locatario: { primeiro_nome: `Pessoa${id}`, bloco: 'A', numero: '30' + id },
    ...extra,
  }) as PedidoRecebido;

describe('RecebidosScreen e o aviso de vaga não entregue (backend D98)', () => {
  it('aviso esperando o dono: badge, contador e vai para "Esperando sua resposta"', async () => {
    (useRecebidos as jest.Mock).mockReturnValue({
      data: [
        p('1', {}),
        p('2', { aviso_nao_entregue_aberto: true, aviso_prazo_ate: '2099-11-12T22:00:00Z' }),
        p('3', { aviso_nao_entregue_aberto: true, aviso_prazo_ate: null }),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    await render(<RecebidosScreen />);
    expect(screen.getByText('Vaga não entregue · responda')).toBeOnTheScreen();
    expect(screen.getByText('Vaga não entregue · em análise')).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/Tempo restante/)).toHaveLength(1);
    const item = screen.getByRole('button', { name: /Pessoa2.*Aviso de vaga não entregue/ });
    expect(within(item).getByLabelText(/Tempo restante/)).toBeOnTheScreen();
    expect(screen.getByText('Esperando sua resposta')).toBeOnTheScreen();
  });

  it('quem espera resposta: pedido novo ou aviso com prazo', () => {
    expect(esperaResposta({ status: 'aguardando_dono', aviso_prazo_ate: null })).toBe(true);
    expect(esperaResposta({ status: 'em_uso', aviso_prazo_ate: '2099-01-01T00:00:00Z' })).toBe(true);
    expect(esperaResposta({ status: 'em_uso', aviso_prazo_ate: null })).toBe(false);
  });
});
