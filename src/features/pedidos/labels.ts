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
  processando_pagamento: 'Processando pagamento',
  aguardando_dono: 'Aguardando resposta',
  aguardando_pix: 'Aguardando Pix',
  confirmado: 'Confirmada',
  em_uso: 'Em uso',
  concluido: 'Concluída',
  recusado: 'Recusado',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
  nao_entregue: 'Vaga não entregue',
};

export function statusLabel(status: string): string {
  return STATUS[status] ?? status;
}

export type StatusTone = 'lime' | 'ink' | 'neutral' | 'danger';

export function statusTone(status: string): StatusTone {
  if (isPendente(status)) return 'lime';
  if (status === 'confirmado' || status === 'em_uso') return 'ink';
  if (status === 'recusado' || status === 'expirado' || status === 'nao_entregue') return 'danger';
  return 'neutral';
}

/**
 * Estados em que o pedido ainda pode mudar sozinho (o app consulta de novo).
 * `processando_pagamento`: o gateway ainda não respondeu (backend D71).
 */
export function isPendente(status: string): boolean {
  return status === 'processando_pagamento' || status === 'aguardando_dono' || status === 'aguardando_pix';
}

export function formaPagamentoLabel(forma: string): string {
  if (forma === 'pix') return 'Pix';
  if (forma === 'cartao') return 'Cartão';
  return forma;
}

export type EstornoStatus = 'em_processamento' | 'em_analise' | 'feito';

/**
 * Texto do reembolso a partir do que o backend devolve (D89/D90 do backend):
 * `reembolso_centavos` é o valor devido; só `estorno_status = feito` diz que o
 * dinheiro voltou. O app nunca mostra reembolso como concluído antes disso.
 * `quem`: "Você" (quem fez o pedido) ou "Quem alugou" / "Quem fez o pedido".
 */
export function reembolsoTexto(
  reembolsoCentavos: number | null | undefined,
  estorno: EstornoStatus | null | undefined,
  quem: string,
  formatCents: (c: number) => string,
): string | null {
  if (reembolsoCentavos == null) return null;
  if (reembolsoCentavos <= 0) return 'Não há valor a devolver.';
  const valor = formatCents(reembolsoCentavos);
  switch (estorno) {
    case 'feito':
      return `Reembolso de ${valor} feito na forma de pagamento usada.`;
    case 'em_analise':
      return `O reembolso de ${valor} está em análise pela equipe do Velo. ${quem} recebe o valor assim que a análise terminar.`;
    case 'em_processamento':
      return `O reembolso de ${valor} está em processamento com a operadora.`;
    default:
      return `${quem} tem ${valor} a receber de volta.`;
  }
}

export const estornoBadge: Record<EstornoStatus, string> = {
  em_processamento: 'Reembolso em processamento',
  em_analise: 'Reembolso em análise',
  feito: 'Reembolso feito',
};
