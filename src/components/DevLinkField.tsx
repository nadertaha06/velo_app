import { useState } from 'react';

import { extractLinkToken, type LinkKind } from '@/lib/linkToken';

import { TextField } from './TextField';

type Props = { kind: LinkKind; onToken: (token: string | null) => void };

/**
 * Só em dev (__DEV__): cola o link do e-mail e extrai o token. Em produção o
 * componente não renderiza nada; o caminho será universal link (D1).
 * O token fica só em memória e só vai para a requisição.
 */
export function DevLinkField({ kind, onToken }: Props) {
  if (!__DEV__) return null;
  return <DevLinkFieldInner kind={kind} onToken={onToken} />;
}

function DevLinkFieldInner({ kind, onToken }: Props) {
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  return (
    <TextField
      label="Colar o link do e-mail (só em dev)"
      value={value}
      autoCapitalize="none"
      keyboardType="url"
      error={invalid ? 'Link inválido para esta tela.' : undefined}
      onChangeText={(text) => {
        setValue(text);
        const token = text.trim() ? extractLinkToken(text, kind) : null;
        setInvalid(!!text.trim() && token === null);
        onToken(token);
      }}
    />
  );
}
