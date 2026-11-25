import { z } from 'zod';

/** Placa antiga (ABC1234 ou ABC-1234) ou Mercosul (ABC1D23). Feedback só: o backend valida. */
export const PLACA_RE = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;

export const veiculoSchema = z.object({
  placa: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => PLACA_RE.test(v), 'Placa inválida. Use o formato ABC1234 ou ABC1D23.'),
  modelo: z.string().trim().min(1, 'Informe o modelo.').max(60),
  porte: z.enum(['P', 'M', 'G'], { message: 'Escolha o porte.' }),
});

export type VeiculoForm = z.input<typeof veiculoSchema>;
