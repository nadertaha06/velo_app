import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontSize, minTouch, radius, spacing } from '@/theme/tokens';
import { fontFamily } from '@/theme/typography';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  /** Campo de senha com botão de mostrar/ocultar. */
  password?: boolean;
};

export function TextField({ label, error, hint, password, ...rest }: Props) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <AppText variant="small" weight={600} tone="muted">
        {label}
      </AppText>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textSubtle}
          autoCorrect={false}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          style={styles.input}
          {...rest}
        />
        {password ? (
          <IconButton
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            onPress={() => setHidden((h) => !h)}
          >
            {hidden ? <Eye color={colors.textMuted} size={20} /> : <EyeOff color={colors.textMuted} size={20} />}
          </IconButton>
        ) : null}
      </View>
      {error ? (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="subtle">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouch + 6,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingLeft: spacing.md,
  },
  boxError: { borderColor: colors.danger },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    fontSize: fontSize.body,
    fontFamily: fontFamily(500),
    color: colors.ink,
  },
});
