import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { isApiError, userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { VeloLogo } from '@/components/brand/VeloLogo';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { contaExcluida, mensagemExclusao } from '@/features/conta/contaExcluida';
import { spacing } from '@/theme/tokens';

import { authApi } from './api';
import { pendingEmail } from './pendingEmail';
import { loginSchema, type LoginForm } from './schemas';

export function LoginScreen() {
  // Voltou ao login depois de excluir a conta: mostra o resultado uma vez.
  const [exclusao] = useState(() => contaExcluida.take());
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const login = useMutation({
    mutationFn: (v: LoginForm) => authApi.login(v.email, v.password),
    onError: (err, v) => {
      if (isApiError(err, 'email_not_verified')) {
        pendingEmail.set(v.email);
        router.push('/verificar-email');
      }
    },
  });

  // A mensagem de credencial errada é a do backend, genérica (spec, seção 5).
  const error = login.error && !isApiError(login.error, 'email_not_verified') ? userMessage(login.error) : null;

  return (
    <Screen title="Entrar" header={<VeloLogo />}>
      {exclusao ? <FormMessage tone="info" message={mensagemExclusao(exclusao)} /> : null}
      <AppText tone="muted">Use o e-mail e a senha da sua conta.</AppText>
      <FormMessage message={error} />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="E-mail"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.email?.message}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Senha"
            password
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.password?.message}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
          />
        )}
      />
      <Button label="Entrar" loading={login.isPending} onPress={handleSubmit((v) => login.mutate(v))} />
      <View style={{ gap: spacing.xs }}>
        <Button variant="ghost" label="Esqueci a senha" onPress={() => router.push('/esqueci-senha')} />
        <Button variant="ghost" label="Recebi um convite" onPress={() => router.push('/cadastro')} />
      </View>
    </Screen>
  );
}
