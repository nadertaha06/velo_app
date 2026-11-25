import { ApiError, NETWORK_MESSAGE, toApiError, userMessage } from '../errors';

describe('toApiError', () => {
  it('lê o envelope do backend', () => {
    const err = toApiError(401, {
      error: { code: 'invalid_credentials', message: 'E-mail ou senha incorretos.', request_id: 'r1' },
    });
    expect(err).toMatchObject({ status: 401, code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' });
  });

  it('mapeia details para campos', () => {
    const err = toApiError(422, {
      error: {
        code: 'validation_error',
        message: 'Dados inválidos.',
        request_id: 'r1',
        details: [{ loc: ['body', 'email'], msg: 'inválido', type: 'value_error' }],
      },
    });
    expect(err.fields).toEqual({ email: 'inválido' });
  });

  it('corpo inesperado vira erro genérico, sem repassar conteúdo', () => {
    const err = toApiError(500, { detail: 'stack trace qualquer' });
    expect(err.code).toBe('unknown');
    expect(err.message).not.toContain('stack');
  });
});

describe('userMessage', () => {
  it('usa a mensagem do backend ou a de conexão', () => {
    expect(userMessage(new ApiError(400, 'x', 'Mensagem.'))).toBe('Mensagem.');
    expect(userMessage(new TypeError('Network request failed'))).toBe(NETWORK_MESSAGE);
  });
});
