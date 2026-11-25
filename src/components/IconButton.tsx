import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { minTouch } from '@/theme/tokens';

type Props = {
  /** Obrigatório: botão só com ícone precisa de rótulo acessível (spec, seção 2). */
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
  selected?: boolean;
};

export function IconButton({ accessibilityLabel, onPress, children, selected }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      hitSlop={4}
      style={styles.base}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minWidth: minTouch, minHeight: minTouch, alignItems: 'center', justifyContent: 'center' },
});
