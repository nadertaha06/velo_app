import { z } from 'zod';

/**
 * Validação só para feedback rápido. Quem valida de verdade é o backend; os
 * limites abaixo espelham os schemas dele (auth/schemas.py e security.py).
 * Senha comum e outras regras da política ficam só no backend.
 */
const email = z.string().trim().min(1, 'Informe o e-mail.').max(254).pipe(z.email('E-mail inválido.'));

const newPassword = z
  .string()
  .min(10, 'A senha precisa ter pelo menos 10 caracteres.')
  .max(128, 'A senha pode ter no máximo 128 caracteres.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.').max(128),
});

export const emailSchema = z.object({ email });

export const registerSchema = z
  .object({
    nome: z.string().trim().min(1, 'Informe seu nome.').max(120),
    email,
    telefone: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\+?[0-9]{10,15}$/.test(v), 'Use só números, com DDD.'),
    password: newPassword,
  })
  .refine((v) => v.password.trim().toLowerCase() !== v.email.toLowerCase(), {
    path: ['password'],
    message: 'A senha não pode ser o e-mail.',
  });

export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'As senhas não conferem.' });

export type LoginForm = z.infer<typeof loginSchema>;
export type EmailForm = z.infer<typeof emailSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type NewPasswordForm = z.infer<typeof newPasswordSchema>;
