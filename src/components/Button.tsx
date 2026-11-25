import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors, minTouch, radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading = false, disabled, ...rest }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.onInk : colors.ink} />
      ) : (
        // Texto sobre limão é sempre ink (spec, seção 2).
        <AppText weight={700} tone={variant === 'secondary' ? 'onInk' : 'default'}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouch + 8,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.lime },
  secondary: { backgroundColor: colors.ink },
  ghost: { backgroundColor: 'transparent', minHeight: minTouch },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
