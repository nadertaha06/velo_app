import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';

import { authApi } from './api';
import { emailSchema, type EmailForm } from './schemas';

export function ForgotPasswordScreen() {
  const { control, handleSubmit, formState } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });
  const forgot = useMutation({ mutationFn: (v: EmailForm) => authApi.forgotPassword(v.email) });

  return (
    <Screen title="Esqueci a senha">
      <AppText tone="muted">
        Informe o e-mail da conta. Se ele estiver cadastrado, enviamos um link para criar uma nova
        senha. O link vale por 30 minutos.
      </AppText>
      <FormMessage
        tone={forgot.isSuccess ? 'info' : 'error'}
        message={forgot.isSuccess ? forgot.data.message : forgot.error ? userMessage(forgot.error) : null}
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
      <Button label="Enviar link" loading={forgot.isPending} onPress={handleSubmit((v) => forgot.mutate(v))} />
      <Button variant="ghost" label="Já tenho o link" onPress={() => router.push('/nova-senha')} />
    </Screen>
  );
}
