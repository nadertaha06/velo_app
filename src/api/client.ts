import createClient from 'openapi-fetch';

import { createSession } from '@/auth/session';
import { pendingEmail } from '@/features/auth/pendingEmail';
import { apiUrl } from '@/lib/config';

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

export const api = createClient<paths>({
  baseUrl: apiUrl(),
  fetch: createAuthFetch(session, (req) => fetch(req)),
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
