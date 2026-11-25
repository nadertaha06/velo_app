import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { colors, minTouch, radius, spacing } from '@/theme/tokens';

import { vinculoKey, vinculoLabel } from './resolve';
import { useVinculo } from './VinculoProvider';

export function ChooseVinculoScreen({ onChosen }: { onChosen?: () => void }) {
  const { state, choose } = useVinculo();
  const options = 'all' in state ? state.all : [];
  const current = state.kind === 'chosen' ? vinculoKey(state.vinculo) : null;

  return (
    <Screen title="Onde você quer entrar?">
      <AppText tone="muted">Você tem acesso a mais de um lugar. Escolha um; dá para trocar depois.</AppText>
      {options.map((v) => {
        const key = vinculoKey(v);
        const { title, detail } = vinculoLabel(v);
        const selected = key === current;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${detail}`}
            accessibilityState={{ selected }}
            onPress={async () => {
              await choose(v);
              onChosen?.();
            }}
            style={[styles.option, selected && styles.selected]}
          >
            <AppText weight={700}>{title}</AppText>
            <AppText variant="small" tone="muted">
              {detail}
            </AppText>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: minTouch,
    padding: spacing.lg,
    gap: spacing.xs,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  selected: { borderColor: colors.ink },
});
