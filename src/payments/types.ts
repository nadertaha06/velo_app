/**
 * Forma de pagamento escolhida na tela. Apple Pay chega ao backend como cartão
 * (com o token que o SDK gerar). Ver spec do app, seção 4, e backend D65.
 */
export type MetodoPagamento = 'apple_pay' | 'cartao' | 'pix';

/** O que vai no corpo do pedido. O token nunca é logado nem guardado. */
export type DadosPagamento =
  | { forma_pagamento: 'pix'; cartao_token?: undefined }
  | { forma_pagamento: 'cartao'; cartao_token: string };

/**
 * Interface do provedor de pagamento no app. A implementação provisória fica em
 * `provisorio.ts`; o SDK do gateway entra atrás desta mesma interface (etapa 5 do app).
 */
export interface PaymentProvider {
  /** Métodos que esta plataforma/build pode oferecer. */
  metodos(): MetodoPagamento[];
  /** Se o método pode ser usado agora (no provisório, cartão só em dev). */
  disponivel(metodo: MetodoPagamento): boolean;
  /** Prepara os dados de pagamento para o pedido (tokeniza o cartão, no SDK real). */
  preparar(metodo: MetodoPagamento): Promise<DadosPagamento>;
}

export class PagamentoIndisponivelError extends Error {
  constructor() {
    super('Essa forma de pagamento ainda não está disponível.');
    this.name = 'PagamentoIndisponivelError';
  }
}
