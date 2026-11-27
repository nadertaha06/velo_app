import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { api, session } from '@/api/client';

import { contaExcluida, mensagemExclusao } from '../contaExcluida';
import { ExcluirContaScreen } from '../ExcluirContaScreen';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/api/client', () => ({
  api: { DELETE: jest.fn() },
  session: { signOut: jest.fn(async () => undefined) },
  unwrap: async (p: Promise<{ data?: unknown; response: { ok: boolean } }>) => (await p).data,
}));

function show() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ExcluirContaScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('Excluir conta (DELETE /me 202, backend D97)', () => {
  it.each(['anonimizada', 'exclusao_pendente'] as const)('%s: sai e guarda a mensagem certa', async (status) => {
    (api.DELETE as jest.Mock).mockResolvedValue({ data: { status }, response: { ok: true } });
    await show();
    const botao = screen.getByRole('button', { name: 'Excluir minha conta' });
    expect(botao).toBeDisabled();
    await fireEvent.press(screen.getByRole('checkbox', { name: /não dá para desfazer/ }));
    await fireEvent.changeText(screen.getByLabelText('Senha atual'), 'senha bem longa 123');
    await fireEvent.press(botao);
    await waitFor(() => expect(session.signOut).toHaveBeenCalledTimes(1));
    expect(api.DELETE).toHaveBeenCalledWith('/me', { body: { password: 'senha bem longa 123' } });
    expect(contaExcluida.take()).toBe(status);
    expect(contaExcluida.take()).toBeNull();
  });

  it('mensagens diferentes para anonimizada e exclusão pendente', () => {
    expect(mensagemExclusao('anonimizada')).toMatch(/dados pessoais foram apagados/);
    expect(mensagemExclusao('exclusao_pendente')).toMatch(/reembolso a caminho/);
    expect(mensagemExclusao('exclusao_pendente')).not.toMatch(/foram apagados/);
  });
});
