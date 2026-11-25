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
import { pendingEmail } from './pendingEmail';
import { emailSchema, type EmailForm } from './schemas';

export function VerifyEmailScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [initialEmail] = useState(() => pendingEmail.take());
  const verify = useMutation({
    mutationFn: (t: string) => authApi.verifyEmail(t),
    onSuccess: () => setToken(null),
  });
  const resend = useMutation({ mutationFn: (v: EmailForm) => authApi.resendVerification(v.email) });
  const { control, handleSubmit, formState } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail },
  });

  if (verify.isSuccess) {
    return (
      <Screen title="E-mail confirmado">
        <AppText tone="muted">{verify.data.message} Agora é só entrar.</AppText>
        <Button label="Entrar" onPress={() => router.dismissTo('/')} />
      </Screen>
    );
  }

  return (
    <Screen title="Confirme seu e-mail">
      <AppText tone="muted">
        Enviamos um link de confirmação. Ele vale por 24 horas. Abra o link neste celular para
        ativar a conta.
      </AppText>
      <DevLinkField kind="verificar-email" onToken={setToken} />
      {__DEV__ ? (
        <>
          <FormMessage message={verify.error ? userMessage(verify.error) : null} />
          <Button
            label="Confirmar e-mail"
            disabled={!token}
            loading={verify.isPending}
            onPress={() => token && verify.mutate(token)}
          />
        </>
      ) : null}

      <AppText variant="bodyLarge" weight={700}>
        Não recebeu?
      </AppText>
      <FormMessage
        tone={resend.isSuccess ? 'info' : 'error'}
        message={resend.isSuccess ? resend.data.message : resend.error ? userMessage(resend.error) : null}
      />
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
          />
        )}
      />
      <Button
        variant="secondary"
        label="Reenviar e-mail"
        loading={resend.isPending}
        onPress={handleSubmit((v) => resend.mutate(v))}
      />
    </Screen>
  );
}
