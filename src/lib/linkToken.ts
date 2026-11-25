/**
 * Extrai o token de um link de e-mail do backend (convite, verificação,
 * redefinição de senha). Aceita `?token=` e `#token=` (o backend vai migrar
 * para fragmento). Ver docs/decisoes.md, D1.
 *
 * O token nunca é logado nem guardado: só vai para a requisição.
 */

export type LinkKind = 'convite' | 'verificar-email' | 'redefinir-senha';

const TOKEN_RE = /^[A-Za-z0-9_-]{20,200}$/;

function fromParams(raw: string): string | null {
  const value = new URLSearchParams(raw).get('token');
  return value && TOKEN_RE.test(value) ? value : null;
}

export function extractLinkToken(input: string, kind: LinkKind): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const path = url.pathname.replace(/\/+$/, '');
  if (!path.endsWith(`/${kind}`)) return null;
  return fromParams(url.hash.replace(/^#/, '')) ?? fromParams(url.search.replace(/^\?/, ''));
}
