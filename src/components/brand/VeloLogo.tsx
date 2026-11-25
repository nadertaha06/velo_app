import { PixelRatio, StyleSheet, View } from 'react-native';

import { colors, spacing, titleLetterSpacing } from '@/theme/tokens';

import { AppText } from '../AppText';
import { VeloSymbol } from './VeloSymbol';

type Props = { size?: number };

/**
 * Logo com o nome: símbolo + "Velo" em Archivo 800. O kit não traz o wordmark
 * em arquivo, então ele é montado aqui (docs/decisoes.md, D8).
 */
export function VeloLogo({ size = 28 }: Props) {
  // O símbolo acompanha a fonte do sistema, para não ficar pequeno ao lado do nome.
  const symbol = Math.round(size * 1.15 * Math.min(PixelRatio.getFontScale(), 2));
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="Velo">
      <VeloSymbol size={symbol} color={colors.ink} />
      <AppText
        weight={800}
        importantForAccessibility="no"
        accessibilityElementsHidden
        style={{ fontSize: size, letterSpacing: titleLetterSpacing(size) }}
      >
        Velo
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' },
});
