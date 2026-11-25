import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Linha de resumo "rótulo — valor". Quebra em duas linhas com fonte grande. */
export function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText variant="small" tone="subtle" style={styles.label}>
        {label}
      </AppText>
      <AppText weight={600} mono={mono} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  label: { minWidth: 80 },
  value: { flexShrink: 1, textAlign: 'right' },
});
