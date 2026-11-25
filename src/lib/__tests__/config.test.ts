import { resolveApiUrl } from '../config';

describe('resolveApiUrl', () => {
  it('aceita https sempre e tira a barra final', () => {
    expect(resolveApiUrl('https://api.velo.test/', false)).toBe('https://api.velo.test');
  });

  it('aceita http só em dev', () => {
    expect(resolveApiUrl('http://192.168.0.2:8000', true)).toBe('http://192.168.0.2:8000');
    expect(() => resolveApiUrl('http://192.168.0.2:8000', false)).toThrow(/https/);
  });

  it.each([undefined, '', 'não é url', 'ftp://x.test', 'https://u:p@x.test', 'https://x.test?a=1'])(
    'recusa %p',
    (raw) => {
      expect(() => resolveApiUrl(raw, true)).toThrow();
    },
  );
});
