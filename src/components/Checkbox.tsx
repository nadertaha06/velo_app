import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, minTouch, radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean };

/** Caixa de seleção com o texto ao lado; a linha inteira é a área de toque. */
export function Checkbox({ label, checked, onChange, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Check color={colors.ink} size={16} strokeWidth={3} /> : null}
      </View>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  disabled: { opacity: 0.5 },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.input / 2,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  boxOn: { backgroundColor: colors.lime },
  label: { flex: 1 },
});
