import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { api, session, unwrap } from '@/api/client';
import { isApiError, userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';

import { contaExcluida } from './contaExcluida';

/**
 * Excluir conta (`DELETE /me`, backend D93 e D97): senha atual obrigatória. O
 * backend responde 202 com `anonimizada` ou `exclusao_pendente`; nos dois casos a
 * conta já não entra, então o app sai e mostra a mensagem certa no login.
 */
export function ExcluirContaScreen() {
  const [senha, setSenha] = useState('');
  const [ciente, setCiente] = useState(false);
  const excluir = useMutation({
    mutationFn: () => unwrap(api.DELETE('/me', { body: { password: senha } })),
    onSuccess: async (r) => {
      contaExcluida.set(r.status);
      setSenha('');
      // Apaga o refresh token e limpa o cache inteiro (spec do app, seção 5).
      await session.signOut();
    },
  });
  const erro = excluir.error
    ? isApiError(excluir.error, 'invalid_password')
      ? 'Senha incorreta.'
      : userMessage(excluir.error)
    : null;
  return (
    <Screen
      title="Excluir conta"
      edges={['bottom']}
      footer={
        <Button
          label="Excluir minha conta"
          disabled={!ciente || senha.length === 0}
          loading={excluir.isPending}
          onPress={() => excluir.mutate()}
        />
      }
    >
      <AppText tone="muted">
        Você sai de todos os condomínios e unidades e não consegue mais entrar. Seus dados pessoais são
        apagados; os registros de pagamento ficam pelo prazo legal, sem ligação com você.
      </AppText>
      <AppText tone="muted">
        Não dá para excluir com reserva ou aviso de vaga não entregue em andamento. Se houver reembolso a
        caminho, a conta é desligada agora e os dados são apagados quando ele terminar.
      </AppText>
      <Checkbox label="Entendi que não dá para desfazer." checked={ciente} onChange={setCiente} />
      <TextField
        label="Senha atual"
        password
        value={senha}
        onChangeText={setSenha}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />
      <FormMessage message={erro} />
    </Screen>
  );
}
