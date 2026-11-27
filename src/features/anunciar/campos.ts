import { addLocalDays, fromLocalParts, toApiInstant } from '@/lib/format';

/**
 * "25", "25,5", "25,50", "1.250,00" → centavos inteiros, sem float (a API trabalha
 * em centavos). Inválido ou zero: `null`. O limite de verdade é o do backend.
 */
export function reaisParaCentavos(texto: string): number | null {
  let t = texto.trim().replace(/^R\$\s*/, '');
  // Sem vírgula, "25.50" é decimal; com vírgula, o ponto é separador de milhar.
  t = !t.includes(',') && /^\d+\.\d{1,2}$/.test(t) ? t.replace('.', ',') : t.replace(/\./g, '');
  const m = /^(\d{1,9})(?:,(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  const reais = Number(m[1]);
  const cent = Number((m[2] ?? '').padEnd(2, '0'));
  const total = reais * 100 + cent;
  return total > 0 ? total : null;
}

/** Centavos → "25,00" para preencher o campo. */
export function centavosParaTexto(c: number | null | undefined): string {
  if (c == null) return '';
  const reais = Math.floor(c / 100);
  const cent = String(c % 100).padStart(2, '0');
  return `${reais},${cent}`;
}

/** "31/12/2026" → partes da data, ou `null` se não for uma data de calendário. */
export function parseData(texto: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { year, month, day };
}

/**
 * Disponibilidade de um dia a outro, inclusive, no fuso de São Paulo:
 * [00:00 do primeiro dia, 00:00 do dia seguinte ao último). Em UTC para a API.
 */
export function periodoDeDias(de: string, ate: string): { inicio: string; fim: string } | null {
  const a = parseData(de);
  const b = parseData(ate);
  if (!a || !b) return null;
  const inicio = { ...a, hour: 0, minute: 0 };
  const fim = addLocalDays({ ...b, hour: 0, minute: 0 }, 1);
  const i = fromLocalParts(inicio);
  const f = fromLocalParts(fim);
  if (f.getTime() <= i.getTime()) return null;
  return { inicio: toApiInstant(i), fim: toApiInstant(f) };
}

/** Só dígitos, para medidas em cm. */
export function inteiroOuNull(texto: string): number | null {
  const t = texto.trim();
  return /^\d{1,5}$/.test(t) ? Number(t) : null;
}
