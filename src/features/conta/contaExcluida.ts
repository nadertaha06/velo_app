/**
 * Resultado da exclusão, só em memória, para a tela de login mostrar a mensagem
 * depois da saída (o app volta ao login e o cache inteiro é limpo).
 */
export type ResultadoExclusao = 'anonimizada' | 'exclusao_pendente';

let atual: ResultadoExclusao | null = null;

export const contaExcluida = {
  set(r: ResultadoExclusao) {
    atual = r;
  },
  /** Lê e apaga: a mensagem aparece uma vez. */
  take(): ResultadoExclusao | null {
    const r = atual;
    atual = null;
    return r;
  },
};

export function mensagemExclusao(r: ResultadoExclusao): string {
  return r === 'anonimizada'
    ? 'Sua conta foi excluída e seus dados pessoais foram apagados. Os registros financeiros ficam guardados pelo prazo legal, sem ligação com você.'
    : 'Recebemos o pedido de exclusão. Sua conta já foi desligada. Como há um reembolso a caminho de você, seus dados pessoais só são apagados quando ele terminar; até lá, a equipe do Velo pode falar com você sobre ele.';
}
