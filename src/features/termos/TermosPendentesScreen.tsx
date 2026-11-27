import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { session } from '@/api/client';
import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';

import { documentoLabel, termosApi, type Documento } from './api';

type Pendente = { documento: Documento; versao: string };

/**
 * Versão nova dos termos ou da política (backend D94): até aceitar, as rotas do
 * condomínio respondem 403. `/me` continua livre, então o app pergunta aqui.
 */
export function TermosPendentesScreen({ pendentes }: { pendentes: Pendente[] }) {
  const qc = useQueryClient();
  const [aceito, setAceito] = useState(false);
  const aceitar = useMutation({
    mutationFn: async () => {
      for (const p of pendentes) await termosApi.aceitar(p.documento, p.versao);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
  const nomes = pendentes.map((p) => `${documentoLabel[p.documento]} (versão ${p.versao})`).join(' e ');
  return (
    <Screen
      title="Atualizamos nossos termos"
      footer={
        <>
          <Button label="Continuar" disabled={!aceito} loading={aceitar.isPending} onPress={() => aceitar.mutate()} />
          <Button variant="ghost" label="Sair" onPress={() => void session.signOut()} />
        </>
      }
    >
      <AppText tone="muted">
        Para continuar usando o Velo no seu condomínio, leia e aceite a versão nova.
      </AppText>
      <Checkbox label={`Li e aceito: ${nomes}.`} checked={aceito} onChange={setAceito} />
      <FormMessage message={aceitar.error ? userMessage(aceitar.error) : null} />
    </Screen>
  );
}
