import createClient from 'openapi-fetch';

import { createSession } from '@/auth/session';
import { pendingEmail } from '@/features/auth/pendingEmail';
import { apiUrl } from '@/lib/config';
import { recordServerDate } from '@/lib/serverClock';

import { createAuthFetch } from './authFetch';
import { ApiError, toApiError } from './errors';
import { queryClient } from './queryClient';
import type { paths } from './schema';

export const session = createSession({
  baseUrl: apiUrl,
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
  onSignedOut: () => {
    queryClient.clear();
    pendingEmail.clear();
  },
});

/** `fetch` que anota a hora do servidor (cabeçalho `Date`) de cada resposta. */
async function fetchComRelogio(req: Request): Promise<Response> {
  const sentAt = Date.now();
  const res = await fetch(req);
  recordServerDate(res.headers.get('date'), sentAt, Date.now());
  return res;
}

export const api = createClient<paths>({
  baseUrl: apiUrl(),
  fetch: createAuthFetch(session, fetchComRelogio),
});

/**
 * Desembrulha a resposta do openapi-fetch: devolve `data` ou lança `ApiError`.
 * Erro de rede sobe como está (vira mensagem de conexão em `userMessage`).
 */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await call;
  if (!response.ok) throw error instanceof ApiError ? error : toApiError(response.status, error);
  return data as T;
}
