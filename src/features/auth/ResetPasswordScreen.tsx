import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DevLinkField } from '@/components/DevLinkField';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';

import { authApi } from './api';
import { newPasswordSchema, type NewPasswordForm } from './schemas';
import { applyFieldErrors } from './useApplyFieldErrors';

export function ResetPasswordScreen() {
  const [token, setToken] = useState<string | null>(null);
  const { control, handleSubmit, formState, setError } = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  });
  const reset = useMutation({
    mutationFn: (v: NewPasswordForm) => authApi.resetPassword(token ?? '', v.password),
    onSuccess: () => setToken(null),
    onError: (err) => applyFieldErrors(err, setError, { new_password: 'password' }),
  });

  if (reset.isSuccess) {
    return (
      <Screen title="Senha alterada">
        <AppText tone="muted">{reset.data.message}</AppText>
        <Button label="Entrar" onPress={() => router.dismissTo('/')} />
      </Screen>
    );
  }

  return (
    <Screen title="Nova senha">
      <AppText tone="muted">Abra neste celular o link que enviamos por e-mail.</AppText>
      <DevLinkField kind="redefinir-senha" onToken={setToken} />
      <FormMessage message={reset.error ? userMessage(reset.error) : null} />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Nova senha"
            password
            hint="Pelo menos 10 caracteres."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.password?.message}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
        )}
      />
      <Controller
        control={control}
        name="confirm"
        render={({ field }) => (
          <TextField
            label="Repita a nova senha"
            password
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.confirm?.message}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
        )}
      />
      <Button
        label="Salvar nova senha"
        disabled={!token}
        loading={reset.isPending}
        onPress={handleSubmit((v) => reset.mutate(v))}
      />
    </Screen>
  );
}
