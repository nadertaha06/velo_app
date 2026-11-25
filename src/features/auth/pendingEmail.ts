/**
 * E-mail digitado no cadastro/login, para pré-preencher a tela de verificação.
 * Só em memória (nunca em parâmetro de rota, que vira URL). Limpo no uso e no logout.
 */
let value: string | null = null;

export const pendingEmail = {
  set: (email: string) => {
    value = email;
  },
  take: (): string => {
    const v = value ?? '';
    value = null;
    return v;
  },
  clear: () => {
    value = null;
  },
};
