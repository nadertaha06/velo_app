import { logger, mask, maskString } from '../logger';

// Valores fictícios, montados só para o teste.
const FAKE_TOKEN = 'x'.repeat(10) + '_' + 'Y'.repeat(20);
const FAKE_JWT = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ0ZXN0ZSJ9.c2lnbmF0dXJhLWZha2U';

describe('maskString', () => {
  it.each([
    ['e-mail', 'falhou para fulano@exemplo.com.br', '[email]'],
    ['jwt', `token ${FAKE_JWT}`, '[jwt]'],
    ['bearer', 'Authorization: Bearer abc.def', 'Bearer [redacted]'],
    ['query token', 'https://x.test/convite?token=abcdef', '?token=[redacted]'],
    ['fragment token', 'https://x.test/convite#token=abcdef', '#token=[redacted]'],
    ['placa antiga', 'placa ABC1234', '[placa]'],
    ['placa antiga com hífen', 'placa ABC-1234', '[placa]'],
    ['placa mercosul', 'placa BRA2E19', '[placa]'],
    ['telefone', 'tel +5511999998888', '[telefone]'],
    ['telefone formatado', 'tel (11) 99999-8888', '[telefone]'],
    ['token opaco', `refresh ${FAKE_TOKEN}`, '[token]'],
  ])('mascara %s', (_name, input, expected) => {
    const out = maskString(input);
    expect(out).toContain(expected);
  });

  it('não deixa o valor original passar', () => {
    const out = maskString(`a fulano@exemplo.com ${FAKE_TOKEN} ABC1D23`);
    expect(out).not.toMatch(/fulano|exemplo|ABC1D23/);
    expect(out).not.toContain(FAKE_TOKEN);
  });
});

describe('mask', () => {
  it('apaga chaves sensíveis em qualquer nível', () => {
    const out = mask({
      password: 'segredo-qualquer',
      user: { nome: 'Fulano', email: 'f@x.com', profile: { telefone: '11999998888' } },
      headers: { Authorization: 'Bearer x' },
      refresh_token: 'abc',
      status: 401,
    });
    expect(out).toEqual({
      password: '[redacted]',
      user: { nome: '[redacted]', email: '[redacted]', profile: { telefone: '[redacted]' } },
      headers: { Authorization: '[redacted]' },
      refresh_token: '[redacted]',
      status: 401,
    });
  });

  it('reduz Error a nome e mensagem mascarada, sem stack', () => {
    const out = mask(new Error('falha com fulano@exemplo.com')) as Record<string, unknown>;
    expect(out).toEqual({ name: 'Error', message: 'falha com [email]' });
  });
});

describe('logger', () => {
  it('passa tudo pela máscara antes do console', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('erro para fulano@exemplo.com', { senha: 'x', ok: true });
    expect(spy).toHaveBeenCalledWith('erro para [email]', { senha: '[redacted]', ok: true });
    spy.mockRestore();
  });
});
