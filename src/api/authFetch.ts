import type { Session } from '@/auth/session';

/** Rotas que não levam access token (o próprio fluxo de autenticação). */
const PUBLIC_PATHS = [
  '/auth/register',
  '/auth/verify-email',
  '/auth/login',
  '/auth/refresh',
  '/auth/password/forgot',
  '/auth/password/reset',
  '/auth/email/confirm',
];

function isPublic(url: string): boolean {
  const { pathname } = new URL(url);
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * `fetch` que põe o Bearer e, se o backend recusar com 401, renova uma vez e
 * repete. A permissão real é do backend: 403/404 passam direto para a tela.
 */
export function createAuthFetch(session: Session, baseFetch: (req: Request) => Promise<Response>) {
  return async function authFetch(input: Request): Promise<Response> {
    if (isPublic(input.url)) return baseFetch(input);

    const retry = input.clone();
    const send = (req: Request, token: string) => {
      req.headers.set('Authorization', `Bearer ${token}`);
      return baseFetch(req);
    };

    const first = await send(input, await session.accessToken());
    if (first.status !== 401) return first;
    return send(retry, await session.refresh());
  };
}
