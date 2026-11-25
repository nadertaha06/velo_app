import { api, session, unwrap } from '@/api/client';

/** Chamadas de autenticação. Tokens de link vão só no corpo, nunca na URL. */
export const authApi = {
  async login(email: string, password: string) {
    const pair = await unwrap(api.POST('/auth/login', { body: { email, password } }));
    await session.signIn(pair);
  },
  register(body: {
    invite_token: string;
    email: string;
    password: string;
    nome: string;
    telefone?: string | null;
  }) {
    return unwrap(api.POST('/auth/register', { body }));
  },
  verifyEmail(token: string) {
    return unwrap(api.POST('/auth/verify-email', { body: { token } }));
  },
  resendVerification(email: string) {
    return unwrap(api.POST('/auth/verify-email/resend', { body: { email } }));
  },
  forgotPassword(email: string) {
    return unwrap(api.POST('/auth/password/forgot', { body: { email } }));
  },
  resetPassword(token: string, new_password: string) {
    return unwrap(api.POST('/auth/password/reset', { body: { token, new_password } }));
  },
  acceptInvite(token: string) {
    return unwrap(api.POST('/convites/aceitar', { body: { token } }));
  },
  me() {
    return unwrap(api.GET('/me'));
  },
};
