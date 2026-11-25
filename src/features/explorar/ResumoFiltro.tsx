import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { formatShort } from '@/lib/format';
import { quantidadeLabel } from '@/features/pedidos/labels';
import { useVeiculoEscolhido } from '@/features/veiculos/useVeiculoEscolhido';
import { colors, minTouch, radius, spacing } from '@/theme/tokens';

import { useFiltro } from './FiltroProvider';

/** Cartão escuro com período e veículo; toca para editar (tela de filtro). */
export function ResumoFiltro({ onEditar }: { onEditar: () => void }) {
  const { inicio, modalidade, quantidade } = useFiltro();
  const { veiculo } = useVeiculoEscolhido();
  const periodo = `A partir de ${formatShort(inicio)} · ${quantidadeLabel(modalidade, quantidade)}`;
  const carro = veiculo ? `${veiculo.modelo} · porte ${veiculo.porte}` : 'Escolha seu veículo';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${periodo}. ${carro}. Editar`}
      onPress={onEditar}
      style={styles.card}
    >
      <View style={styles.text}>
        <AppText weight={700} tone="onInk">
          {periodo}
        </AppText>
        <AppText variant="small" tone="onInk">
          {carro}
        </AppText>
      </View>
      <AppText variant="small" weight={700} style={styles.edit}>
        Editar
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  text: { flex: 1, gap: spacing.xs },
  // Texto sobre lime é sempre ink.
  edit: {
    color: colors.ink,
    backgroundColor: colors.lime,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
