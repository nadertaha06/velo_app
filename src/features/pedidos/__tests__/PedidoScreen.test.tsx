import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';

import type { PedidoFeito } from '../api';
import { useCancelarPedido, usePedido } from '../hooks';
import { PedidoScreen } from '../PedidoScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useLocalSearchParams: () => ({ id: 'p1' }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  usePedido: jest.fn(),
  useCancelarPedido: jest.fn(),
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
  cancelado_em: null,
  cancelado_por: null,
  reembolso_centavos: null,
  estorno_status: null,
  feito_por_mim: true,
  dono: { primeiro_nome: 'Rafael', bloco: 'A', numero: '112' },
  pix_copia_cola: null,
};

const mutate = jest.fn();

function show(p: Partial<PedidoFeito>, cancel: Partial<{ error: unknown; isPending: boolean }> = {}) {
  (usePedido as jest.Mock).mockReturnValue({ isLoading: false, data: { ...base, ...p } });
  (useCancelarPedido as jest.Mock).mockReturnValue({ mutate, isPending: false, error: null, ...cancel });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <PedidoScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('PedidoScreen', () => {
  it('aguardando o dono: contador e texto de cartão reservado', async () => {
    await show({});
    expect(screen.getByText('Aguardando Rafael responder')).toBeOnTheScreen();
    expect(screen.getByLabelText(/Tempo restante/)).toBeOnTheScreen();
    expect(screen.getByText(/R\$\s75,00 estão reservados no seu cartão/)).toBeOnTheScreen();
  });

  it('cancelar pede confirmação, mostra a regra e chama a API', async () => {
    await show({ status: 'confirmado' });
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar pedido' }));
    expect(screen.getByText(/menos a taxa de serviço/)).toBeOnTheScreen();
    expect(mutate).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('404 ao cancelar: pedido de outro morador', async () => {
    await show({ status: 'confirmado' }, { error: new ApiError(404, 'not_found', 'Não encontrado.') });
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar pedido' }));
    expect(screen.getByText('Só quem fez o pedido pode cancelar.')).toBeOnTheScreen();
  });

  it('erro de regra do backend aparece como veio', async () => {
    await show(
      { status: 'confirmado' },
      { error: new ApiError(409, 'payment_in_progress', 'Há uma cobrança em andamento. Tente de novo em instantes.') },
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar pedido' }));
    expect(screen.getByText(/cobrança em andamento/)).toBeOnTheScreen();
  });

  it('cancelado mostra o reembolso que a API devolveu, sem dizer que voltou antes da hora', async () => {
    await show({ status: 'cancelado', cancelado_por: 'locatario', reembolso_centavos: 7125, estorno_status: 'em_processamento' });
    expect(screen.getByText(/reembolso de R\$\s71,25 está em processamento/)).toBeOnTheScreen();
    expect(screen.queryByText(/feito na forma de pagamento/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Cancelar/ })).toBeNull();
  });

  it('estorno em análise e estorno feito (backend D89/D90)', async () => {
    await show({ status: 'cancelado', cancelado_por: 'dono', reembolso_centavos: 7500, estorno_status: 'em_analise' });
    expect(screen.getByText(/R\$\s75,00 está em análise/)).toBeOnTheScreen();
    await screen.unmount();
    await show({ status: 'cancelado', cancelado_por: 'dono', reembolso_centavos: 7500, estorno_status: 'feito' });
    expect(screen.getByText(/Reembolso de R\$\s75,00 feito/)).toBeOnTheScreen();
  });

  it('pedido de outro morador: sem botão de cancelar, com o aviso', async () => {
    await show({ status: 'confirmado', feito_por_mim: false });
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).toBeNull();
    expect(screen.getByText(/feito por outro morador da sua unidade/)).toBeOnTheScreen();
  });

  it('cancelado sem valor a devolver', async () => {
    await show({ status: 'cancelado', cancelado_por: 'sistema', reembolso_centavos: 0 });
    expect(screen.getByText(/vínculo com a unidade foi encerrado\. Não há valor a devolver/)).toBeOnTheScreen();
  });

  it('sem placa na resposta, não mostra placa', async () => {
    await show({});
    expect(screen.queryByText('Placa')).toBeNull();
  });

  it('aguardando Pix: quem fez vê o copia e cola; outro morador vê só o aviso', async () => {
    await show({ status: 'aguardando_pix', forma_pagamento: 'pix', pix_expira_em: '2099-11-12T13:15:00Z', pix_copia_cola: 'codigo-pix-ficticio' });
    expect(screen.getByText('codigo-pix-ficticio')).toBeOnTheScreen();
    await screen.unmount();
    await show({ status: 'aguardando_pix', forma_pagamento: 'pix', pix_expira_em: '2099-11-12T13:15:00Z' });
    expect(screen.getByText('Aguardando o Pix')).toBeOnTheScreen();
    expect(screen.getByText(/feito por quem fez o pedido/)).toBeOnTheScreen();
  });

  it('encerrado não oferece cancelar', async () => {
    await show({ status: 'recusado' });
    expect(screen.queryByRole('button', { name: /Cancelar/ })).toBeNull();
  });
});
