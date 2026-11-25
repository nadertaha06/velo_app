import { z } from 'zod';

/**
 * Envelope único de erro do backend:
 * `{"error": {"code", "message", "request_id", "details"?}}`.
 * O OpenAPI não descreve esse envelope (só o 422 padrão do FastAPI), então ele é
 * validado aqui em tempo de execução. Ver docs/decisoes.md, D4.
 */
const envelope = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    request_id: z.string().nullish(),
    details: z
      .array(z.object({ loc: z.array(z.union([z.string(), z.number()])), msg: z.string() }).loose())
      .optional(),
  }),
});

export const NETWORK_MESSAGE = 'Não foi possível falar com o servidor. Confira sua conexão.';
const GENERIC_MESSAGE = 'Algo deu errado. Tente de novo.';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Campo (último item de `loc`) → mensagem, só para erro de validação. */
  readonly fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function toApiError(status: number, body: unknown): ApiError {
  const parsed = envelope.safeParse(body);
  if (!parsed.success) return new ApiError(status, 'unknown', GENERIC_MESSAGE);
  const { code, message, details } = parsed.data.error;
  const fields: Record<string, string> = {};
  for (const d of details ?? []) {
    const last = d.loc[d.loc.length - 1];
    if (typeof last === 'string' && !(last in fields)) fields[last] = d.msg;
  }
  return new ApiError(status, code, message, fields);
}

/** Mensagem para mostrar ao usuário, para qualquer erro vindo de uma chamada. */
export function userMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return NETWORK_MESSAGE;
}

/** 401 de credencial, 403 e 404 são respostas esperadas, não falhas do app. */
export function isApiError(err: unknown, code?: string): err is ApiError {
  return err instanceof ApiError && (code === undefined || err.code === code);
}
