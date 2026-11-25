import * as SecureStore from 'expo-secure-store';

import { ApiError } from '@/api/errors';

import { refreshStore } from '../refreshStore';
import { createSession } from '../session';

// Tokens fictícios.
const pair = (n: number) => ({ access_token: `access-${n}`, refresh_token: `refresh-${n}`, expires_in: 900 });

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function setup(fetchImpl: jest.Mock) {
  let now = 1_000_000;
  const onSignedOut = jest.fn();
  const session = createSession({
    baseUrl: () => 'http://api.test',
    fetch: fetchImpl,
    now: () => now,
    onSignedOut,
  });
  return { session, onSignedOut, advance: (ms: number) => (now += ms) };
}

beforeEach(() => {
  (SecureStore as unknown as { __store: Map<string, string> }).__store.clear();
});

describe('session', () => {
  it('signIn guarda o refresh no SecureStore e o access só em memória', async () => {
    const { session } = setup(jest.fn());
    await session.signIn(pair(1));
    expect(await refreshStore.get()).toBe('refresh-1');
    expect(await session.accessToken()).toBe('access-1');
    expect(session.getStatus()).toBe('signedIn');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(expect.anything(), 'access-1', expect.anything());
  });

  it('várias chamadas simultâneas fazem uma única renovação', async () => {
    let resolve!: (r: Response) => void;
    const fetchMock = jest.fn(() => new Promise<Response>((r) => (resolve = r)));
    const { session, advance } = setup(fetchMock);
    await session.signIn(pair(1));
    advance(900_000); // access venceu

    const calls = [session.accessToken(), session.accessToken(), session.refresh()];
    await new Promise<void>((r) => setImmediate(r)); // deixa a renovação chegar ao fetch
    resolve(json(200, pair(2)));
    await expect(Promise.all(calls)).resolves.toEqual(['access-2', 'access-2', 'access-2']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await refreshStore.get()).toBe('refresh-2');
  });

  it('renovação recusada (401) encerra a sessão e limpa o estado', async () => {
    const fetchMock = jest.fn(async () =>
      json(401, { error: { code: 'invalid_refresh_token', message: 'Sessão inválida.', request_id: 'r' } }),
    );
    const { session, onSignedOut } = setup(fetchMock);
    await session.signIn(pair(1));
    await expect(session.refresh()).rejects.toBeInstanceOf(ApiError);
    expect(session.getStatus()).toBe('signedOut');
    expect(await refreshStore.get()).toBeNull();
    expect(onSignedOut).toHaveBeenCalled();
  });

  it('falha de rede na renovação não encerra a sessão', async () => {
    const { session, onSignedOut } = setup(jest.fn(async () => Promise.reject(new TypeError('Network request failed'))));
    await session.signIn(pair(1));
    await expect(session.refresh()).rejects.toThrow('Network');
    expect(await refreshStore.get()).toBe('refresh-1');
    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it('restore sem refresh token vai para signedOut sem chamar a API', async () => {
    const fetchMock = jest.fn();
    const { session } = setup(fetchMock);
    await session.restore();
    expect(session.getStatus()).toBe('signedOut');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('restore offline mostra o estado offline e mantém o refresh token', async () => {
    await refreshStore.set('refresh-1');
    const { session } = setup(jest.fn(async () => Promise.reject(new TypeError('Network request failed'))));
    await session.restore();
    expect(session.getStatus()).toBe('offline');
    expect(await refreshStore.get()).toBe('refresh-1');
  });

  it('signOut avisa o backend e limpa tudo, mesmo se a chamada falhar', async () => {
    const fetchMock = jest.fn(async () => Promise.reject(new TypeError('offline')));
    const { session, onSignedOut } = setup(fetchMock);
    await session.signIn(pair(1));
    await session.signOut();
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/auth/logout', expect.objectContaining({ method: 'POST' }));
    expect(await refreshStore.get()).toBeNull();
    expect(onSignedOut).toHaveBeenCalled();
    expect(session.getStatus()).toBe('signedOut');
  });
});
