import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Chip } from '@/components/Chip';
import { FormMessage } from '@/components/FormMessage';
import { OptionCard } from '@/components/OptionCard';
import { TextField } from '@/components/TextField';
import { MODALIDADES, modalidadeChip, modalidadeUnidade, type Modalidade } from '@/features/pedidos/labels';
import { spacing } from '@/theme/tokens';

import type { VagaGestao } from './api';
import { centavosParaTexto, reaisParaCentavos } from './campos';

const PRAZOS = [1, 4, 12, 24] as const;
type Prazo = (typeof PRAZOS)[number];

export type PrecosAprovacao = {
  precos: Record<Modalidade, number | null>;
  modo_aprovacao: 'automatica' | 'manual';
  prazo_resposta_horas: Prazo | null;
};

/** Cada modalidade pode ficar desligada; preços em centavos inteiros (spec do backend). */
export function PassoPrecos({
  vaga,
  salvando,
  erro,
  onVoltar,
  onSalvar,
}: {
  vaga: VagaGestao | undefined;
  salvando: boolean;
  erro: string | null;
  onVoltar: () => void;
  onSalvar: (v: PrecosAprovacao) => void;
}) {
  const [ligado, setLigado] = useState<Record<Modalidade, boolean>>(() => {
    const r = {} as Record<Modalidade, boolean>;
    for (const m of MODALIDADES) r[m] = vaga ? vaga.precos[m] != null : m === 'dia';
    return r;
  });
  const [valor, setValor] = useState<Record<Modalidade, string>>(() => {
    const r = {} as Record<Modalidade, string>;
    for (const m of MODALIDADES) r[m] = centavosParaTexto(vaga?.precos[m]);
    return r;
  });
  const [modo, setModo] = useState<'automatica' | 'manual'>((vaga?.modo_aprovacao as 'automatica' | 'manual') ?? 'manual');
  const [prazo, setPrazo] = useState<Prazo>((vaga?.prazo_resposta_horas as Prazo | null) ?? 4);
  const [local, setLocal] = useState<string | null>(null);

  function salvar() {
    const precos = {} as Record<Modalidade, number | null>;
    for (const m of MODALIDADES) {
      if (!ligado[m]) {
        precos[m] = null;
        continue;
      }
      const c = reaisParaCentavos(valor[m]);
      if (c == null) {
        setLocal(`Informe o preço ${modalidadeChip[m].toLowerCase()} em reais, por exemplo 25,00.`);
        return;
      }
      precos[m] = c;
    }
    if (MODALIDADES.every((m) => precos[m] == null)) {
      setLocal('Ligue pelo menos uma modalidade.');
      return;
    }
    setLocal(null);
    onSalvar({ precos, modo_aprovacao: modo, prazo_resposta_horas: modo === 'manual' ? prazo : null });
  }

  return (
    <>
      <AppText weight={700} accessibilityRole="header">
        Preços por modalidade
      </AppText>
      {MODALIDADES.map((m) => (
        <View key={m} style={styles.bloco}>
          <Checkbox
            label={`Aceito ${modalidadeChip[m].toLowerCase()}`}
            checked={ligado[m]}
            onChange={(v) => setLigado((s) => ({ ...s, [m]: v }))}
          />
          {ligado[m] ? (
            <TextField
              label={`Preço por ${modalidadeUnidade[m]} (R$)`}
              value={valor[m]}
              onChangeText={(t) => setValor((s) => ({ ...s, [m]: t }))}
              keyboardType="decimal-pad"
              placeholder="25,00"
            />
          ) : null}
        </View>
      ))}
      <AppText variant="small" tone="muted">
        A taxa do Velo sai do valor de cada reserva. Você vê quanto recebe em cada pedido.
      </AppText>

      <AppText weight={700} accessibilityRole="header">
        Como aprovar os pedidos
      </AppText>
      <OptionCard
        title="Automática"
        description="O pedido vira reserva na hora, sem você responder."
        selected={modo === 'automatica'}
        onPress={() => setModo('automatica')}
      />
      <OptionCard
        title="Manual"
        description="Você aprova ou recusa cada pedido dentro do prazo."
        selected={modo === 'manual'}
        onPress={() => setModo('manual')}
      />
      {modo === 'manual' ? (
        <>
          <AppText variant="small" weight={600}>
            Prazo para responder
          </AppText>
          <View style={styles.chips}>
            {PRAZOS.map((h) => (
              <Chip key={h} label={`${h} h`} selected={prazo === h} onPress={() => setPrazo(h)} />
            ))}
          </View>
        </>
      ) : null}
      <FormMessage message={local ?? erro} />
      <Button label="Continuar" loading={salvando} onPress={salvar} />
      <Button variant="ghost" label="Voltar" onPress={onVoltar} />
    </>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
