import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/Chip';
import { MODALIDADES, modalidadeChip, type Modalidade } from '@/features/pedidos/labels';
import { spacing } from '@/theme/tokens';

type Props = {
  value: Modalidade;
  onChange: (m: Modalidade) => void;
  /** Rótulo de cada chip (ex.: com o preço da vaga) e se está ligado. */
  label?: (m: Modalidade) => string;
  disabled?: (m: Modalidade) => boolean;
};

export function ModalidadeChips({ value, onChange, label, disabled }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {MODALIDADES.map((m) => (
        <Chip
          key={m}
          label={label ? label(m) : modalidadeChip[m]}
          selected={m === value}
          disabled={disabled?.(m)}
          onPress={() => onChange(m)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: spacing.sm } });
