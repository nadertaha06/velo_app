import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { addLocalDays, formatDay, fromLocalParts, localParts } from '@/lib/format';
import { modalidadeUnidade, quantidadeLabel } from '@/features/pedidos/labels';
import { useVeiculoEscolhido } from '@/features/veiculos/useVeiculoEscolhido';
import { spacing } from '@/theme/tokens';

import { useFiltro } from './FiltroProvider';

/** Dias oferecidos para o início. Só um atalho de escolha; o backend decide o que vale. */
const DIAS = 60;
const HORAS = Array.from({ length: 24 }, (_, h) => h);
/** Limite do backend para a quantidade (`CotacaoIn.quantidade`). */
const QTD_MAX = 366;

export function FiltroScreen() {
  const filtro = useFiltro();
  const { veiculo, veiculos } = useVeiculoEscolhido();
  const atual = localParts(new Date(filtro.inicio));

  const dias = useMemo(() => {
    const hoje = localParts(new Date());
    return Array.from({ length: DIAS }, (_, i) => addLocalDays({ ...hoje, hour: 12, minute: 0 }, i));
  }, []);

  const setInicio = (p: { year: number; month: number; day: number; hour: number }) =>
    filtro.set({ inicio: fromLocalParts({ ...p, minute: 0 }).toISOString() });

  return (
    <Screen
      title="Período e veículo"
      edges={['bottom']}
      footer={<Button label="Ver vagas" onPress={() => router.back()} />}
    >
      <AppText variant="bodyLarge" weight={700}>
        Início
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {dias.map((d) => {
          const selected = d.year === atual.year && d.month === atual.month && d.day === atual.day;
          return (
            <Chip
              key={`${d.year}-${d.month}-${d.day}`}
              label={formatDay(fromLocalParts(d).toISOString())}
              selected={selected}
              onPress={() => setInicio({ ...d, hour: atual.hour })}
            />
          );
        })}
      </ScrollView>
      <View style={styles.wrap}>
        {HORAS.map((h) => (
          <Chip
            key={h}
            label={`${String(h).padStart(2, '0')}h`}
            selected={h === atual.hour}
            onPress={() => setInicio({ ...atual, hour: h })}
          />
        ))}
      </View>

      <AppText variant="bodyLarge" weight={700}>
        Quanto tempo
      </AppText>
      <Stepper
        label={quantidadeLabel(filtro.modalidade, filtro.quantidade)}
        unidade={modalidadeUnidade[filtro.modalidade]}
        value={filtro.quantidade}
        min={1}
        max={QTD_MAX}
        onChange={(q) => filtro.set({ quantidade: q })}
      />
      <AppText variant="small" tone="muted">
        {quantidadeLabel(filtro.modalidade, filtro.quantidade)}. O fim exato aparece na cotação da vaga.
      </AppText>

      <AppText variant="bodyLarge" weight={700}>
        Veículo
      </AppText>
      {veiculos.map((v) => (
        <OptionCard
          key={v.id}
          title={v.modelo}
          description={`Porte ${v.porte}`}
          selected={veiculo?.id === v.id}
          onPress={() => filtro.set({ veiculoId: v.id })}
        />
      ))}
      <Button variant="secondary" label="Adicionar veículo" onPress={() => router.push('/veiculo-novo')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
