/** Formatação de dinheiro, data e duração (spec, seção 4). O app só formata; não calcula preço nem prazo. */

export const TZ = 'America/Sao_Paulo';

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

const shortFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const dayFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

/** Exibe no fuso de São Paulo um instante ISO 8601 vindo da API. */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** "12 de nov., 18:00" */
export function formatShort(iso: string): string {
  return shortFmt.format(new Date(iso));
}

/** "qui., 12 de nov." */
export function formatDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatPeriod(inicio: string, fim: string): string {
  return `${formatShort(inicio)} → ${formatShort(fim)}`;
}

/** Instante para enviar à API: ISO 8601 em UTC. */
export function toApiInstant(date: Date): string {
  return date.toISOString();
}

// --- fuso de São Paulo ------------------------------------------------------------------

export type LocalParts = { year: number; month: number; day: number; hour: number; minute: number };

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** Data e hora de parede em São Paulo para um instante. */
export function localParts(date: Date): LocalParts & { second: number } {
  const p: Record<string, number> = {};
  for (const { type, value } of partsFmt.formatToParts(date)) {
    if (type !== 'literal') p[type] = Number(value);
  }
  return {
    year: p.year!,
    month: p.month!,
    day: p.day!,
    hour: p.hour! % 24,
    minute: p.minute!,
    second: p.second!,
  };
}

function offsetMs(date: Date): number {
  const p = localParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Instante (UTC) de uma data e hora de parede em São Paulo. Usa o fuso do Intl,
 * então continua certo se o horário de verão voltar.
 */
export function fromLocalParts(p: LocalParts): Date {
  const guess = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const first = guess - offsetMs(new Date(guess));
  const second = guess - offsetMs(new Date(first));
  return new Date(second);
}

/** Mesma hora de parede, `days` dias depois (no calendário de São Paulo). */
export function addLocalDays(p: LocalParts, days: number): LocalParts {
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day + days));
  return { ...p, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

// --- duração ----------------------------------------------------------------------------

/** "3h 42min", "12min", "menos de 1 min". Para contadores visuais. */
export function formatDuration(ms: number): string {
  if (ms < 60_000) return 'menos de 1 min';
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  return `${minutes}min`;
}

const meters = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** 250 → "2,5" (metros). */
export function formatMeters(cm: number): string {
  return meters.format(cm / 100);
}
