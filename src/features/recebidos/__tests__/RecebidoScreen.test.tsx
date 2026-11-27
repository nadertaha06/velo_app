import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { PedidoRecebido } from '../api';
import { useAcaoRecebido, useRecebido } from '../hooks';
import { RecebidoScreen } from '../RecebidoScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() }, useLocalSearchParams: () => ({ id: 'p1' }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/features/vinculo/useActiveVinculo', () => ({
  useActiveVinculo: () => ({ condominio_id: 'c1', unidade_id: 'u1', papel: 'responsavel' }),
}));
jest.mock('@/features/naoEntrega/hooks', () => ({
  useAviso: () => ({ isSuccess: true, data: null }),
  useResponderAviso: () => ({ mutate: jest.fn(), isPending: false, error: null }),
}));
jest.mock('../hooks', () => ({ useRecebido: jest.fn(), useAcaoRecebido: jest.fn() }));

const base: PedidoRecebido = {
  id: 'p1',
  status: 'aguardando_dono',
  vaga: { id: 'v1', numero: '47', andar: 'Subsolo 1' },
  modalidade: 'dia',
  quantidade: 3,
  inicio: '2099-11-12T21:00:00Z',
  fim: '2099-11-15T21:00:00Z',
  preco_unitario_centavos: 2500,
  total_centavos: 7500,
  taxa_centavos: 375,
  valor_dono_centavos: 7125,
  forma_pagamento: 'cartao',
  mensagem: 'Posso usar a sua até sexta?',
  prazo_resposta_em: '2099-11-12T17:00:00Z',
  pix_expira_em: null,
  created_at: '2099-11-12T13:00:00Z',
  veiculo: { porte: 'M', placa: null, modelo: null },
  cancelado_em: null,
  cancelado_por: null,
  reembolso_centavos: null,
  estorno_status: null,
  aviso_nao_entregue_aberto: false,
  aviso_prazo_ate: null,
  locatario: { primeiro_nome: 'Júlia', bloco: 'A', numero: '301' },
};

const acoes: Record<string, jest.Mock> = { aprovar: jest.fn(), recusar: jest.fn(), cancelar: jest.fn() };

function show(p: Partial<PedidoRecebido>) {
  (useRecebido as jest.Mock).mockReturnValue({ isLoading: false, data: { ...base, ...p } });
  (useAcaoRecebido as jest.Mock).mockImplementation((_id: string, acao: string) => ({
    mutate: acoes[acao],
    isPending: false,
    error: null,
  }));
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RecebidoScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('RecebidoScreen', () => {
  it('novo pedido: contador, porte sem placa e valores da API', async () => {
    await show({});
    expect(screen.getByText('Novo pedido')).toBeOnTheScreen();
    expect(screen.getByLabelText(/Tempo restante/)).toBeOnTheScreen();
    expect(screen.getByText('Júlia · Ap. 301, Bloco A')).toBeOnTheScreen();
    expect(screen.getByText('Liberados depois que você aprovar')).toBeOnTheScreen();
    expect(screen.getByText(/R\$\s71,25/)).toBeOnTheScreen();
    expect(screen.getByText('“Posso usar a sua até sexta?”')).toBeOnTheScreen();
  });

  it('aprovar chama a API; recusar pede confirmação antes', async () => {
    await show({});
    await fireEvent.press(screen.getByRole('button', { name: 'Aprovar' }));
    expect(acoes.aprovar).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Recusar' }));
    expect(acoes.recusar).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar recusa' }));
    expect(acoes.recusar).toHaveBeenCalledTimes(1);
  });

  it('confirmado: mostra a placa que a API devolveu e oferece cancelar', async () => {
    await show({ status: 'confirmado', prazo_resposta_em: null, veiculo: { porte: 'M', placa: 'TST1A23', modelo: 'Modelo Teste' } });
    expect(screen.getByText('TST1A23')).toBeOnTheScreen();
    expect(screen.queryByText('Liberados depois que você aprovar')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar reserva' }));
    expect(screen.getByText(/conta para a\s+suspensão da vaga/)).toBeOnTheScreen();
  });
});
