import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DevLinkField } from '@/components/DevLinkField';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { authApi } from '@/features/auth/api';

import { meQueryKey } from './VinculoProvider';

/** Quem já tem conta aceita um convite novo por aqui (POST /convites/aceitar). */
export function AcceptInviteScreen() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const accept = useMutation({
    mutationFn: (t: string) => authApi.acceptInvite(t),
    onSuccess: () => {
      setToken(null);
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });

  return (
    <Screen title="Aceitar convite">
      <AppText tone="muted">Abra neste celular o link do convite que você recebeu.</AppText>
      <FormMessage
        tone={accept.isSuccess ? 'info' : 'error'}
        message={accept.isSuccess ? accept.data.message : accept.error ? userMessage(accept.error) : null}
      />
      <DevLinkField kind="convite" onToken={setToken} />
      {__DEV__ ? (
        <Button
          label="Aceitar convite"
          disabled={!token}
          loading={accept.isPending}
          onPress={() => token && accept.mutate(token)}
        />
      ) : null}
    </Screen>
  );
}
