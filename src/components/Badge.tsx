import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

export type BadgeTone = 'lime' | 'ink' | 'neutral' | 'danger';

const bg: Record<BadgeTone, string> = {
  lime: colors.lime,
  ink: colors.ink,
  neutral: colors.chip,
  danger: colors.bg,
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  return (
    <View style={[styles.base, { backgroundColor: bg[tone] }, tone === 'danger' && styles.danger]}>
      <AppText
        variant="caption"
        weight={700}
        // Texto sobre lime é ink; sobre ink é branco; erro é texto escuro com borda vermelha.
        tone={tone === 'ink' ? 'onInk' : tone === 'danger' ? 'danger' : 'default'}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  danger: { borderWidth: 1, borderColor: colors.danger },
});
