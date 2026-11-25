import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Card } from './Card';

type Props = { message?: string | null; tone?: 'error' | 'info' };

/** Mensagem de formulário (erro do backend ou aviso). Anunciada por leitor de tela. */
export function FormMessage({ message, tone = 'error' }: Props) {
  if (!message) return null;
  return (
    <Card
      style={[styles.base, tone === 'error' && styles.error]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <AppText variant="small" weight={600} tone={tone === 'error' ? 'danger' : 'default'}>
        {message}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  base: { padding: spacing.md, borderRadius: radius.input },
  error: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.bg },
});
