import type { MetodoPagamento } from './types';

export const metodoLabel: Record<MetodoPagamento, string> = {
  apple_pay: 'Apple Pay',
  cartao: 'Cartão de crédito',
  pix: 'Pix',
};

/**
 * Quando cada forma cobra (spec do app, seção 4). Os textos seguem o fluxo do
 * backend (D65): no manual, cartão pré-autoriza e cobra na aprovação, Pix só
 * gera a cobrança na aprovação; no automático, cobra ao criar o pedido.
 */
export function quandoCobra(metodo: MetodoPagamento, automatica: boolean, dono: string): string {
  if (automatica) {
    return metodo === 'pix'
      ? 'Você recebe o código Pix assim que enviar o pedido e tem até 15 minutos para pagar.'
      : 'O valor é cobrado ao enviar o pedido, e a reserva fica confirmada na hora.';
  }
  if (metodo === 'pix') {
    return `Nada é cobrado agora. Se ${dono} aprovar, você recebe o código Pix e tem até 15 minutos para pagar.`;
  }
  if (metodo === 'apple_pay') {
    return `O valor fica reservado no cartão e só é cobrado quando ${dono} aprovar. Se recusar ou não responder, a reserva é liberada.`;
  }
  return 'Mesmo funcionamento: reserva agora, cobra só na aprovação.';
}
