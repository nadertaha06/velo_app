import { ApiError, toApiError } from '@/api/errors';
import { logger } from '@/lib/logger';

import { refreshStore } from './refreshStore';

/**
 * Sessão: access token só em memória; refresh token no SecureStore.
 *
 * - Uma única renovação em andamento por vez: chamadas concorrentes esperam a
 *   mesma promessa (sem corrida entre telas, o que dispararia a detecção de
 *   reuso do backend e derrubaria a família de tokens).
 * - Renovação recusada pelo backend (401) encerra a sessão local.
 * - Falha de rede não encerra a sessão: o erro sobe para quem chamou.
 */

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn' | 'offline';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type Deps = {
  baseUrl: () => string;
  fetch: typeof fetch;
  now: () => number;
  /** Limpeza de estado com dados de pessoas (cache do TanStack Query etc.). */
  onSignedOut: () => void;
};

/** Renova um pouco antes de vencer, para não mandar token quase expirado. */
const SKEW_MS = 30_000;

export function createSession(deps: Deps) {
  let status: SessionStatus = 'loading';
  let access: { token: string; expiresAt: number } | null = null;
  let inflight: Promise<string> | null = null;
  const listeners = new Set<() => void>();

  function setStatus(next: SessionStatus) {
    if (status === next) return;
    status = next;
    listeners.forEach((l) => l());
  }

  async function storePair(pair: TokenPair) {
    await refreshStore.set(pair.refresh_token);
    access = { token: pair.access_token, expiresAt: deps.now() + pair.expires_in * 1000 };
    setStatus('signedIn');
  }

  async function clearLocal() {
    access = null;
    await refreshStore.clear();
    deps.onSignedOut();
    setStatus('signedOut');
  }

  async function doRefresh(): Promise<string> {
    const refreshToken = await refreshStore.get();
    if (!refreshToken) {
      await clearLocal();
      throw new ApiError(401, 'not_authenticated', 'Entre de novo.');
    }
    const res = await deps.fetch(`${deps.baseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      const err = toApiError(res.status, await res.json().catch(() => null));
      if (res.status === 401) {
        logger.info('Sessão encerrada pelo servidor.');
        await clearLocal();
      }
      throw err;
    }
    const pair = (await res.json()) as TokenPair;
    await storePair(pair);
    return pair.access_token;
  }

  /** Renova o access token; chamadas simultâneas compartilham a mesma requisição. */
  function refresh(): Promise<string> {
    inflight ??= doRefresh().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  return {
    getStatus: () => status,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Access token válido para a próxima requisição, renovando se preciso. */
    async accessToken(): Promise<string> {
      if (access && access.expiresAt - SKEW_MS > deps.now()) return access.token;
      return refresh();
    },
    /** Usado quando o backend recusa o access token (401) antes do vencimento. */
    refresh,

    /** Na abertura do app: tenta recuperar a sessão a partir do refresh token. */
    async restore(): Promise<void> {
      if (!(await refreshStore.get())) {
        setStatus('signedOut');
        return;
      }
      try {
        await refresh();
      } catch (err) {
        if (!(err instanceof ApiError)) setStatus('offline');
      }
    },

    signIn: storePair,

    /** Logout: avisa o backend (melhor esforço) e limpa tudo localmente. */
    async signOut(): Promise<void> {
      const token = access?.token;
      if (token) {
        try {
          await deps.fetch(`${deps.baseUrl()}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          logger.warn('Logout no servidor falhou; sessão local encerrada mesmo assim.');
        }
      }
      await clearLocal();
    },
  };
}

export type Session = ReturnType<typeof createSession>;
