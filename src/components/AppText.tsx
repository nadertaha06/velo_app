import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSize, titleLetterSpacing } from '@/theme/tokens';
import { fontFamily, type Weight } from '@/theme/typography';

type Variant = 'titleLarge' | 'title' | 'body' | 'bodyLarge' | 'small' | 'caption';
type Tone = 'default' | 'muted' | 'subtle' | 'danger' | 'onInk';

type Props = TextProps & {
  variant?: Variant;
  tone?: Tone;
  weight?: Weight;
  mono?: boolean;
};

const toneColor: Record<Tone, string> = {
  default: colors.ink,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  danger: colors.danger,
  onInk: colors.onInk,
};

export function AppText({ variant = 'body', tone = 'default', weight, mono, style, ...rest }: Props) {
  const isTitle = variant === 'title' || variant === 'titleLarge';
  const size = fontSize[variant];
  return (
    <Text
      {...rest}
      accessibilityRole={isTitle ? 'header' : rest.accessibilityRole}
      style={[
        {
          fontSize: size,
          color: toneColor[tone],
          fontFamily: fontFamily(weight ?? (isTitle ? 800 : 400), mono),
        },
        isTitle && { letterSpacing: titleLetterSpacing(size) },
        styles.base,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({ base: { flexShrink: 1 } });
