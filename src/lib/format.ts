/** Formatação de dinheiro e data (spec, seção 4). O app só formata; não calcula. */

const TZ = 'America/Sao_Paulo';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** A API trabalha em centavos inteiros. */
export function formatCents(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error('Valor em centavos precisa ser inteiro.');
  return brl.format(cents / 100);
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Exibe no fuso de São Paulo um instante ISO 8601 vindo da API. */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** Instante para enviar à API: ISO 8601 em UTC. */
export function toApiInstant(date: Date): string {
  return date.toISOString();
}
