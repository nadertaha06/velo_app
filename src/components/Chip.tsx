import { Pressable, StyleSheet } from 'react-native';

import { colors, minTouch, radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = { label: string; selected: boolean; onPress: () => void; disabled?: boolean };

export function Chip({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, selected ? styles.on : styles.off, disabled && styles.disabled]}
    >
      <AppText variant="small" weight={700} tone={selected ? 'onInk' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { backgroundColor: colors.ink },
  off: { backgroundColor: colors.chip },
  disabled: { opacity: 0.5 },
});
