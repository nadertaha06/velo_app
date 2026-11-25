/* eslint-disable no-console -- único lugar autorizado a usar console (spec, seção 5). */

/**
 * Logger com máscara. Nada de token, senha, e-mail, telefone, placa ou nome sai
 * daqui. Em produção só `warn` e `error`, e nunca request/response.
 */

const REDACTED = '[redacted]';

/** Chaves cujo valor nunca é logado, em qualquer nível de aninhamento. */
const SENSITIVE_KEY =
  /pass(word)?|senha|token|secret|authorization|cookie|e-?mail|nome|name|telefone|phone|placa|plate|modelo|cpf|link|url/i;

const PATTERNS: [RegExp, string][] = [
  // JWT
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[jwt]'],
  // Bearer <qualquer coisa>
  [/Bearer\s+\S+/gi, 'Bearer [redacted]'],
  // token=... em query ou fragmento
  [/([?#&]token=)[^&#\s]+/gi, '$1[redacted]'],
  // e-mail
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]'],
  // placa Mercosul (ABC1D23) e antiga (ABC1234 / ABC-1234)
  [/\b[A-Za-z]{3}-?\d[A-Za-z0-9]\d{2}\b/g, '[placa]'],
  // telefone: 10 a 15 dígitos, com ou sem +, espaços, parênteses e hífen
  [/\+?\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}\b/g, '[telefone]'],
  // tokens opacos: sequência longa url-safe (≥ 20)
  [/\b[A-Za-z0-9_-]{20,}\b/g, '[token]'],
];

export function maskString(input: string): string {
  return PATTERNS.reduce((s, [re, rep]) => s.replace(re, rep), input);
}

export function mask(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[…]';
  if (typeof value === 'string') return maskString(value);
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Error) {
    // Só nome e mensagem mascarada; sem stack (pode ter dados em closures de rede).
    return { name: value.name, message: maskString(value.message) };
  }
  if (Array.isArray(value)) return value.map((v) => mask(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEY.test(k) ? REDACTED : mask(v, depth + 1);
  }
  return out;
}

type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, message: string, data?: unknown): void {
  if (!__DEV__ && (level === 'debug' || level === 'info')) return;
  const args: unknown[] = [maskString(message)];
  if (data !== undefined) args.push(mask(data));
  console[level](...args);
}

export const logger = {
  debug: (message: string, data?: unknown) => emit('debug', message, data),
  info: (message: string, data?: unknown) => emit('info', message, data),
  warn: (message: string, data?: unknown) => emit('warn', message, data),
  error: (message: string, data?: unknown) => emit('error', message, data),
};
