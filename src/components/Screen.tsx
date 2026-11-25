import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = { title?: string; subtitle?: string; header?: ReactNode; children: ReactNode };

/** Tela com área segura, rolagem e teclado. Rolagem garante fonte grande sem cortar. */
export function Screen({ title, subtitle, header, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          {subtitle ? (
            <AppText variant="caption" weight={500} tone="subtle">
              {subtitle}
            </AppText>
          ) : null}
          {title ? <AppText variant="titleLarge">{title}</AppText> : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1 },
});
