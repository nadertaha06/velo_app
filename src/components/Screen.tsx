import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = {
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  children: ReactNode;
  /** Bordas com área segura. Telas com cabeçalho nativo usam só `bottom`; abas, só `top`. */
  edges?: Edge[];
  /** Rodapé fixo (botão principal), fora da rolagem. */
  footer?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/** Tela com área segura, rolagem e teclado. Rolagem garante fonte grande sem cortar. */
export function Screen({
  title,
  subtitle,
  header,
  children,
  edges = ['top', 'bottom'],
  footer,
  onRefresh,
  refreshing = false,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
          }
        >
          {header}
          {subtitle ? (
            <AppText variant="caption" weight={500} tone="subtle">
              {subtitle}
            </AppText>
          ) : null}
          {title ? <AppText variant="titleLarge">{title}</AppText> : null}
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
