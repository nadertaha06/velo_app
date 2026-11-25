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
import { registerSchema, type RegisterForm } from './schemas';
import { applyFieldErrors } from './useApplyFieldErrors';

const FIELD_MAP = { nome: 'nome', email: 'email', telefone: 'telefone', password: 'password' } as const;

export function RegisterScreen() {
  // Token do convite: só em memória, só para esta requisição (spec, seção 5).
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const { control, handleSubmit, formState, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', email: '', telefone: '', password: '' },
  });
  const register = useMutation({
    mutationFn: (v: RegisterForm) =>
      authApi.register({
        invite_token: inviteToken ?? '',
        nome: v.nome,
        email: v.email,
        telefone: v.telefone || null,
        password: v.password,
      }),
    onSuccess: (_res, v) => {
      setInviteToken(null);
      pendingEmail.set(v.email);
      router.replace('/verificar-email');
    },
    onError: (err) => applyFieldErrors(err, setError, FIELD_MAP),
  });

  return (
    <Screen title="Criar conta">
      <AppText tone="muted">
        O cadastro é feito a partir do convite que você recebeu do síndico ou do responsável da
        unidade. Abra o link do convite neste celular.
      </AppText>
      <DevLinkField kind="convite" onToken={setInviteToken} />
      <FormMessage message={register.error ? userMessage(register.error) : null} />
      <Controller
        control={control}
        name="nome"
        render={({ field }) => (
          <TextField
            label="Nome"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.nome?.message}
            autoComplete="name"
            textContentType="name"
          />
        )}
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
            textContentType="username"
          />
        )}
      />
      <Controller
        control={control}
        name="telefone"
        render={({ field }) => (
          <TextField
            label="Telefone (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.telefone?.message}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
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
      <Button
        label="Criar conta"
        disabled={!inviteToken}
        loading={register.isPending}
        onPress={handleSubmit((v) => register.mutate(v))}
      />
      {!inviteToken ? (
        <AppText variant="small" tone="subtle">
          Sem o link do convite não dá para criar a conta.
        </AppText>
      ) : null}
    </Screen>
  );
}
