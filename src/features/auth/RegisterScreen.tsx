import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { isApiError, userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { VeloLogo } from '@/components/brand/VeloLogo';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { DevLinkField } from '@/components/DevLinkField';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { termosApi } from '@/features/termos/api';

import { authApi } from './api';
import { pendingEmail } from './pendingEmail';
import { registerSchema, type RegisterForm } from './schemas';
import { applyFieldErrors } from './useApplyFieldErrors';

const FIELD_MAP = { nome: 'nome', email: 'email', telefone: 'telefone', password: 'password' } as const;

export function RegisterScreen() {
  // Token do convite: só em memória, só para esta requisição (spec, seção 5).
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  // Versões vigentes dos termos e da política (backend D94): o cadastro manda as aceitas.
  const termos = useQuery({ queryKey: ['termos'], queryFn: termosApi.vigentes });
  const [aceito, setAceito] = useState(false);
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
        aceite_termos_uso: termos.data?.termos_uso ?? '',
        aceite_politica_privacidade: termos.data?.politica_privacidade ?? '',
      }),
    onSuccess: (_res, v) => {
      setInviteToken(null);
      pendingEmail.set(v.email);
      router.replace('/verificar-email');
    },
    onError: (err) => {
      applyFieldErrors(err, setError, FIELD_MAP);
      // Saiu versão nova enquanto a tela estava aberta: busca de novo e pede o aceite outra vez.
      if (isApiError(err, 'terms_version_outdated')) {
        setAceito(false);
        void termos.refetch();
      }
    },
  });

  return (
    <Screen title="Criar conta" header={<VeloLogo />}>
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
      <Checkbox
        label={
          termos.data
            ? `Li e aceito os Termos de uso (versão ${termos.data.termos_uso}) e a Política de privacidade (versão ${termos.data.politica_privacidade}).`
            : 'Li e aceito os Termos de uso e a Política de privacidade.'
        }
        checked={aceito}
        onChange={setAceito}
        disabled={!termos.data}
      />
      {termos.isError ? <FormMessage message={userMessage(termos.error)} /> : null}
      <Button
        label="Criar conta"
        disabled={!inviteToken || !aceito || !termos.data}
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
