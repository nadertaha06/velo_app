import { formatCents } from '@/lib/format';

import type { AvisoNaoEntrega } from './api';

/** Texto do estado do aviso para cada lado. Valores e decisões vêm do backend. */
export function avisoResumo(a: AvisoNaoEntrega, lado: 'feito' | 'recebido'): { titulo: string; texto: string } {
  const reembolso = a.reembolso_centavos != null && a.reembolso_centavos > 0 ? formatCents(a.reembolso_centavos) : null;
  switch (a.status) {
    case 'aguardando_dono':
      return lado === 'feito'
        ? { titulo: 'Aviso enviado', texto: 'O responsável pela vaga tem um prazo para confirmar ou contestar.' }
        : {
            titulo: 'Quem alugou avisou que a vaga não estava livre',
            texto: 'Confirme se a vaga estava ocupada, ou conteste explicando o que houve. Sem resposta no prazo, o aviso vale.',
          };
    case 'aguardando_admin':
      return {
        titulo: 'Aviso em análise',
        texto: 'A equipe do Velo vai decidir o reembolso. Você vê o resultado aqui.',
      };
    case 'procedente':
      return {
        titulo: 'Aviso aceito',
        texto: reembolso
          ? `${lado === 'feito' ? 'Você recebe' : 'Quem alugou recebe'} ${reembolso} de volta. Acompanhe o reembolso no pedido.`
          : 'O aviso foi aceito.',
      };
    case 'improcedente':
      return { titulo: 'Aviso não aceito', texto: 'A análise concluiu que a vaga estava disponível. Não há reembolso.' };
    default:
      return { titulo: 'Aviso de vaga não entregue', texto: '' };
  }
}
