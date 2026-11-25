import { randomId } from '@/lib/randomId';

/** Prefixo do token falso. O teste do bundle de produção procura por este texto. */
export const DEV_TOKEN_PREFIX = 'tok_dev_';

/** Token de mentira que o `FakeGateway` do backend aceita. Só existe em build de dev. */
export function devCardToken(): string {
  return `${DEV_TOKEN_PREFIX}${randomId(24)}`;
}
