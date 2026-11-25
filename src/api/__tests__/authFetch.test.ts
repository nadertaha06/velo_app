import type { Session } from '@/auth/session';

import { createAuthFetch } from '../authFetch';

function fakeSession(): jest.Mocked<Pick<Session, 'accessToken' | 'refresh'>> {
  return {
    accessToken: jest.fn(async () => 'old'),
    refresh: jest.fn(async () => 'new'),
  };
}

const ok = () => new Response('{}', { status: 200 });
const unauthorized = () => new Response('{}', { status: 401 });

describe('authFetch', () => {
  it('põe o Bearer nas rotas autenticadas', async () => {
    const base = jest.fn(async (_r: Request) => ok());
    const s = fakeSession();
    await createAuthFetch(s as unknown as Session, base)(new Request('http://api.test/me'));
    expect(base.mock.calls[0]![0].headers.get('Authorization')).toBe('Bearer old');
  });

  it('não põe token nas rotas de autenticação', async () => {
    const base = jest.fn(async (_r: Request) => ok());
    const s = fakeSession();
    await createAuthFetch(s as unknown as Session, base)(
      new Request('http://api.test/auth/login', { method: 'POST', body: '{}' }),
    );
    expect(base.mock.calls[0]![0].headers.get('Authorization')).toBeNull();
    expect(s.accessToken).not.toHaveBeenCalled();
  });

  it('no 401 renova uma vez e repete com o mesmo corpo', async () => {
    const base = jest.fn<Promise<Response>, [Request]>().mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(ok());
    const s = fakeSession();
    const res = await createAuthFetch(s as unknown as Session, base)(
      new Request('http://api.test/me/email', { method: 'POST', body: '{"a":1}' }),
    );
    expect(res.status).toBe(200);
    expect(s.refresh).toHaveBeenCalledTimes(1);
    const retried = base.mock.calls[1]![0];
    expect(retried.headers.get('Authorization')).toBe('Bearer new');
    expect(await retried.text()).toBe('{"a":1}');
  });

  it('não entra em laço: segundo 401 volta para quem chamou', async () => {
    const base = jest.fn(async (_r: Request) => unauthorized());
    const s = fakeSession();
    const res = await createAuthFetch(s as unknown as Session, base)(new Request('http://api.test/me'));
    expect(res.status).toBe(401);
    expect(base).toHaveBeenCalledTimes(2);
  });

  it('403 e 404 passam direto, sem renovar', async () => {
    for (const status of [403, 404]) {
      const base = jest.fn(async (_r: Request) => new Response('{}', { status }));
      const s = fakeSession();
      const res = await createAuthFetch(s as unknown as Session, base)(new Request('http://api.test/me'));
      expect(res.status).toBe(status);
      expect(s.refresh).not.toHaveBeenCalled();
    }
  });
});
