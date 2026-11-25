/** Rótulos de exibição. Só texto: valores e regras vêm do backend. */

export const MODALIDADES = ['dia', 'semana', 'mes', 'ano'] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const modalidadeChip: Record<Modalidade, string> = {
  dia: 'Diária',
  semana: 'Semanal',
  mes: 'Mensal',
  ano: 'Anual',
};

/** "/dia", "/semana"... ao lado do preço unitário. */
export const modalidadeUnidade: Record<Modalidade, string> = {
  dia: 'dia',
  semana: 'semana',
  mes: 'mês',
  ano: 'ano',
};

const plural: Record<Modalidade, [string, string]> = {
  dia: ['diária', 'diárias'],
  semana: ['semana', 'semanas'],
  mes: ['mês', 'meses'],
  ano: ['ano', 'anos'],
};

/** 3 + dia → "3 diárias". */
export function quantidadeLabel(modalidade: string, quantidade: number): string {
  const p = plural[modalidade as Modalidade];
  if (!p) return `${quantidade} × ${modalidade}`;
  return `${quantidade} ${quantidade === 1 ? p[0] : p[1]}`;
}

export function isModalidade(v: string): v is Modalidade {
  return (MODALIDADES as readonly string[]).includes(v);
}

export const PORTES = ['P', 'M', 'G'] as const;
export type Porte = (typeof PORTES)[number];

export const porteLabel: Record<Porte, string> = { P: 'Pequeno', M: 'Médio', G: 'Grande' };

const STATUS: Record<string, string> = {
  aguardando_dono: 'Aguardando resposta',
  aguardando_pix: 'Aguardando Pix',
  confirmado: 'Confirmada',
  em_uso: 'Em uso',
  concluido: 'Concluída',
  recusado: 'Recusado',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
};

export function statusLabel(status: string): string {
  return STATUS[status] ?? status;
}

export type StatusTone = 'lime' | 'ink' | 'neutral' | 'danger';

export function statusTone(status: string): StatusTone {
  if (status === 'aguardando_dono' || status === 'aguardando_pix') return 'lime';
  if (status === 'confirmado' || status === 'em_uso') return 'ink';
  if (status === 'recusado' || status === 'expirado') return 'danger';
  return 'neutral';
}

/** Estados em que o pedido ainda pode mudar sozinho (o app consulta de novo). */
export function isPendente(status: string): boolean {
  return status === 'aguardando_dono' || status === 'aguardando_pix';
}

export function formaPagamentoLabel(forma: string): string {
  if (forma === 'pix') return 'Pix';
  if (forma === 'cartao') return 'Cartão';
  return forma;
}
