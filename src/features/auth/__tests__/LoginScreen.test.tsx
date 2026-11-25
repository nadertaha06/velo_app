import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';

import { ApiError } from '@/api/errors';

import { authApi } from '../api';
import { LoginScreen } from '../LoginScreen';
import { pendingEmail } from '../pendingEmail';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), dismissTo: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('../api', () => ({ authApi: { login: jest.fn() } }));

const login = authApi.login as jest.Mock;

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('E-mail'), email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  pendingEmail.clear();
});

describe('LoginScreen', () => {
  it('valida antes de chamar a API', async () => {
    await render(wrap(<LoginScreen />));
    await fill('', '');
    expect(await screen.findByText('Informe o e-mail.')).toBeOnTheScreen();
    expect(login).not.toHaveBeenCalled();
  });

  it('mostra a mensagem genérica do backend', async () => {
    login.mockRejectedValueOnce(new ApiError(401, 'invalid_credentials', 'E-mail ou senha incorretos.'));
    await render(wrap(<LoginScreen />));
    await fill('pessoa@exemplo.test', 'senha-ficticia-123');
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeOnTheScreen();
    expect(login).toHaveBeenCalledWith('pessoa@exemplo.test', 'senha-ficticia-123');
  });

  it('e-mail não verificado leva à tela de verificação, sem e-mail na rota', async () => {
    login.mockRejectedValueOnce(new ApiError(403, 'email_not_verified', 'Confirme seu e-mail antes de entrar.'));
    await render(wrap(<LoginScreen />));
    await fill('pessoa@exemplo.test', 'senha-ficticia-123');
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/verificar-email'));
    expect(pendingEmail.take()).toBe('pessoa@exemplo.test');
  });

  it('falha de rede mostra mensagem de conexão', async () => {
    login.mockRejectedValueOnce(new TypeError('Network request failed'));
    await render(wrap(<LoginScreen />));
    await fill('pessoa@exemplo.test', 'senha-ficticia-123');
    expect(await screen.findByText(/Confira sua conexão/)).toBeOnTheScreen();
  });
});
