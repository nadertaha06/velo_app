/** Nomes das famílias carregadas em fonts.ts (uma por peso). */
export type Weight = 400 | 500 | 600 | 700 | 800 | 900;

const archivo: Record<Weight, string> = {
  400: 'Archivo_400Regular',
  500: 'Archivo_500Medium',
  600: 'Archivo_600SemiBold',
  700: 'Archivo_700Bold',
  800: 'Archivo_800ExtraBold',
  900: 'Archivo_900Black',
};

/** Fonte customizada no RN: um arquivo por peso, então o peso vira família. */
export function fontFamily(weight: Weight = 400, mono = false): string {
  if (mono) return weight >= 700 ? 'JetBrainsMono_700Bold' : 'JetBrainsMono_500Medium';
  return archivo[weight];
}
