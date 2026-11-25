import { colors } from '../tokens';

/** Contraste WCAG 2.x entre duas cores hex. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('tokens de cor', () => {
  it('usa as cores oficiais da marca', () => {
    expect(colors.lime).toBe('#A3FF00');
    expect(colors.danger).toBe('#FF1A1A');
  });

  it.each([
    ['ink sobre lime', colors.ink, colors.lime],
    ['textMuted sobre bg', colors.textMuted, colors.bg],
    ['textMuted sobre surface', colors.textMuted, colors.surface],
    ['textSubtle sobre bg', colors.textSubtle, colors.bg],
    ['dangerText sobre bg', colors.dangerText, colors.bg],
    ['dangerText sobre surface', colors.dangerText, colors.surface],
    ['onInk sobre ink', colors.onInk, colors.ink],
  ])('%s passa 4,5:1 (texto)', (_n, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('danger passa 3:1 sobre bg (borda e ícone)', () => {
    expect(contrast(colors.danger, colors.bg)).toBeGreaterThanOrEqual(3);
  });

  it('texto branco pequeno sobre danger não passa: por isso é proibido', () => {
    expect(contrast(colors.onInk, colors.danger)).toBeLessThan(4.5);
  });
});
