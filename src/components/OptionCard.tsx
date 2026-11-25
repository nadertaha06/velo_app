import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, minTouch, radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = {
  title: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  right?: ReactNode;
};

/** Opção de escolha única (forma de pagamento, veículo). Exposta como rádio. */
export function OptionCard({ title, description, selected, disabled, onPress, right }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, selected && styles.selected, disabled && styles.disabled]}
    >
      <View style={styles.text}>
        <AppText weight={700}>{title}</AppText>
        {description ? (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      {right}
      <View style={[styles.dot, selected && styles.dotOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  selected: { borderColor: colors.ink },
  disabled: { opacity: 0.5 },
  text: { flex: 1, gap: spacing.xs },
  dot: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border },
  dotOn: { borderColor: colors.ink, backgroundColor: colors.lime },
});
