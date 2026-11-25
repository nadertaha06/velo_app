import { fireEvent, render, screen } from '@testing-library/react-native';

import { useCotacao, useVaga } from '@/features/explorar/hooks';
import { useVeiculoEscolhido } from '@/features/veiculos/useVeiculoEscolhido';

import { useCriarPedido } from '../hooks';
import { PagamentoScreen } from '../PagamentoScreen';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => ({ vagaId: 'v1' }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/features/explorar/hooks', () => ({ useVaga: jest.fn(), useCotacao: jest.fn() }));
jest.mock('@/features/veiculos/useVeiculoEscolhido', () => ({ useVeiculoEscolhido: jest.fn() }));
jest.mock('@/features/explorar/FiltroProvider', () => ({
  useFiltro: () => ({ modalidade: 'dia', quantidade: 3, inicio: '2099-11-12T21:00:00.000Z', veiculoId: 'c1' }),
}));
jest.mock('../hooks', () => ({ useCriarPedido: jest.fn() }));

const mutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useVaga as jest.Mock).mockReturnValue({
    data: {
      id: 'v1',
      numero: '47',
      andar: 'Subsolo 1',
      modo_aprovacao: 'manual',
      dono: { primeiro_nome: 'Rafael', bloco: 'A', numero: '112' },
    },
  });
  (useCotacao as jest.Mock).mockReturnValue({
    data: {
      modalidade: 'dia',
      quantidade: 3,
      inicio: '2099-11-12T21:00:00Z',
      fim: '2099-11-15T21:00:00Z',
      total_centavos: 7500,
    },
  });
  (useVeiculoEscolhido as jest.Mock).mockReturnValue({ veiculo: { id: 'c1', modelo: 'X', porte: 'M' } });
  (useCriarPedido as jest.Mock).mockReturnValue({ mutate, isPending: false, error: null });
});

describe('PagamentoScreen', () => {
  it('envia Pix sem token, com os valores da cotação e chave de idempotência', async () => {
    await render(<PagamentoScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Pix' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar pedido com Pix' }));
    expect(mutate).toHaveBeenCalledTimes(1);
    const [{ body, key }] = mutate.mock.calls[0];
    expect(body).toEqual({
      vaga_id: 'v1',
      veiculo_id: 'c1',
      modalidade: 'dia',
      quantidade: 3,
      inicio: '2099-11-12T21:00:00Z',
      forma_pagamento: 'pix',
    });
    expect(key).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
  });

  it('repetir o mesmo envio usa a mesma chave; trocar a forma gera outra', async () => {
    await render(<PagamentoScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Pix' }));
    const enviar = () => fireEvent.press(screen.getByRole('button', { name: /Enviar pedido/ }));
    await enviar();
    await enviar();
    await fireEvent.press(screen.getByRole('radio', { name: 'Cartão de crédito' }));
    await enviar();
    const keys = mutate.mock.calls.map((c) => c[0].key);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
    expect(mutate.mock.calls[2][0].body).toMatchObject({ forma_pagamento: 'cartao', cartao_token: expect.stringMatching(/^tok_dev_/) });
  });

  it('textos de quando cobra no modo manual', async () => {
    await render(<PagamentoScreen />);
    expect(screen.getByText(/Nada é cobrado agora. Se Rafael aprovar/)).toBeOnTheScreen();
  });
});
