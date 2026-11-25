import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import type { PedidoFeito } from '../api';
import { usePedido } from '../hooks';
import { PedidoScreen } from '../PedidoScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useLocalSearchParams: () => ({ id: 'p1' }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('../hooks', () => ({
  usePedido: jest.fn(),
  useCancelarPedido: () => ({ disponivel: false }),
}));

const base: PedidoFeito = {
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
  mensagem: null,
  prazo_resposta_em: '2099-11-12T17:00:00Z',
  pix_expira_em: null,
  created_at: '2099-11-12T13:00:00Z',
  veiculo: { porte: 'M', placa: null, modelo: 'Modelo Teste' },
  dono: { primeiro_nome: 'Rafael', bloco: 'A', numero: '112' },
  pix_copia_cola: null,
};

function show(p: Partial<PedidoFeito>) {
  (usePedido as jest.Mock).mockReturnValue({ isLoading: false, data: { ...base, ...p } });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <PedidoScreen />
    </QueryClientProvider>,
  );
}

describe('PedidoScreen', () => {
  it('aguardando o dono: contador e cancelar desabilitado "em breve"', async () => {
    await show({});
    expect(screen.getByText('Aguardando Rafael responder')).toBeOnTheScreen();
    expect(screen.getByLabelText(/Tempo restante/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cancelar pedido (em breve)' })).toBeDisabled();
    expect(screen.getByText(/R\$\s75,00 estão reservados no seu cartão/)).toBeOnTheScreen();
  });

  it('sem placa na resposta, não mostra placa', async () => {
    await show({});
    expect(screen.queryByText('Placa')).toBeNull();
  });

  it('aguardando Pix mostra o copia e cola', async () => {
    await show({ status: 'aguardando_pix', forma_pagamento: 'pix', pix_expira_em: '2099-11-12T13:15:00Z', pix_copia_cola: 'codigo-pix-ficticio' });
    expect(screen.getByText('Pague com Pix')).toBeOnTheScreen();
    expect(screen.getByText('codigo-pix-ficticio')).toBeOnTheScreen();
  });

  it('encerrado não oferece cancelar', async () => {
    await show({ status: 'recusado' });
    expect(screen.getByText('Pedido recusado')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Cancelar/ })).toBeNull();
  });
});
