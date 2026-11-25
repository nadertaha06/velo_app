const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Identificador aleatório url-safe. Usa `crypto.getRandomValues` quando o
 * runtime oferece; senão cai para `Math.random`. Serve para chaves de
 * idempotência e tokens de dev, que precisam ser únicos, não secretos.
 */
export function randomId(length: number): string {
  const bytes = new Uint8Array(length);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** Chave de idempotência do pedido: 16 a 128 caracteres `[A-Za-z0-9_-]` (backend, D65). */
export function idempotencyKey(): string {
  return `${Date.now().toString(36)}_${randomId(22)}`;
}
