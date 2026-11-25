/** Tokens visuais da direção "Pista" (docs/spec.md, seção 2). Telas usam só estes valores. */
export const colors = {
  ink: '#0e0e0e',
  bg: '#ffffff',
  lime: '#D6F33A',
  surface: '#f6f6f3',
  chip: '#f1f1ef',
  border: '#e6e6e3',
  textMuted: '#4a4a47',
  textSubtle: '#5f5f5c',
  /** Texto sobre `ink` (botão secundário, cartão escuro). */
  onInk: '#ffffff',
  /** Erro de formulário: contraste ≥ 4,5:1 com `bg`. */
  danger: '#b3261e',
} as const;

export const radius = {
  input: 12,
  chip: 12,
  card: 16,
  button: 14,
  cardLarge: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const fontSize = {
  caption: 12,
  small: 13,
  body: 15,
  bodyLarge: 17,
  title: 24,
  titleLarge: 28,
} as const;

/** −0,02 em aplicado ao tamanho do título. */
export const titleLetterSpacing = (size: number): number => size * -0.02;

/** Área de toque mínima (spec, seção 2). */
export const minTouch = 44;
