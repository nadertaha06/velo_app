import { Minus, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** Ex.: "diária", para os rótulos "Menos uma diária". */
  unidade: string;
  label: string;
};

export function Stepper({ value, min, max, onChange, unidade, label }: Props) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment' && value < max) onChange(value + 1);
        if (e.nativeEvent.actionName === 'decrement' && value > min) onChange(value - 1);
      }}
    >
      <View style={[styles.btn, value <= min && styles.off]}>
        <IconButton accessibilityLabel={`Menos uma ${unidade}`} onPress={() => value > min && onChange(value - 1)}>
          <Minus color={colors.ink} size={20} />
        </IconButton>
      </View>
      <AppText variant="title" style={styles.value}>
        {value}
      </AppText>
      <View style={[styles.btn, value >= max && styles.off]}>
        <IconButton accessibilityLabel={`Mais uma ${unidade}`} onPress={() => value < max && onChange(value + 1)}>
          <Plus color={colors.ink} size={20} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: { borderRadius: radius.input, backgroundColor: colors.chip },
  off: { opacity: 0.4 },
  value: { minWidth: 36, textAlign: 'center' },
});
