/**
 * Hora do servidor. Cada resposta da API traz o cabeçalho `Date`; a diferença
 * para o relógio do aparelho vira um deslocamento, usado pelos contadores de
 * prazo. Assim um celular com a hora errada não mostra um prazo errado.
 * O prazo em si (o instante) já vem do backend.
 */
let offsetMs = 0;

/** `sentAt`/`receivedAt`: relógio do aparelho antes e depois da requisição. */
export function recordServerDate(header: string | null, sentAt: number, receivedAt: number): void {
  if (!header) return;
  const server = Date.parse(header);
  if (Number.isNaN(server)) return;
  // O `Date` tem resolução de segundo: compara com o meio da requisição, +0,5 s.
  offsetMs = server + 500 - (sentAt + receivedAt) / 2;
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function serverOffsetMs(): number {
  return offsetMs;
}

/** Só para testes. */
export function resetServerClock(): void {
  offsetMs = 0;
}
