import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type Props = ViewProps & { children: ReactNode; dark?: boolean; large?: boolean };

export function Card({ children, dark, large, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[styles.base, large && styles.large, dark ? styles.dark : styles.light, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm },
  large: { borderRadius: radius.cardLarge, padding: spacing.xl },
  light: { backgroundColor: colors.surface },
  dark: { backgroundColor: colors.ink },
});
