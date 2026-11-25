import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { formatCents, formatMeters } from '@/lib/format';
import { modalidadeUnidade, type Modalidade } from '@/features/pedidos/labels';
import { colors, radius, spacing } from '@/theme/tokens';

import type { VagaAnuncio } from './api';

export function vagaTitulo(v: { numero: string; andar: string }): string {
  return `Vaga ${v.numero} · ${v.andar}`;
}

export function vagaMedidas(v: VagaAnuncio, comAltura = false): string {
  const medidas = [v.largura_cm, v.comprimento_cm, ...(comAltura ? [v.altura_cm] : [])]
    .map(formatMeters)
    .join(' × ');
  return [v.coberta ? 'Coberta' : null, `${medidas} m`, `até ${v.porte_maximo}`].filter(Boolean).join(' · ');
}

export function donoLabel(d: { primeiro_nome: string | null; bloco: string; numero: string }): string {
  const unidade = `${d.bloco} ${d.numero}`.trim();
  return d.primeiro_nome ? `${d.primeiro_nome} · ${unidade}` : unidade;
}

export function aprovacaoLabel(v: Pick<VagaAnuncio, 'modo_aprovacao' | 'prazo_resposta_horas'>): string {
  if (v.modo_aprovacao === 'automatica') return 'Reserva instantânea';
  return v.prazo_resposta_horas ? `Responde em até ${v.prazo_resposta_horas}h` : 'Aprovação manual';
}

type Props = { vaga: VagaAnuncio; modalidade: Modalidade; onPress: () => void };

export function VagaCard({ vaga, modalidade, onPress }: Props) {
  const preco = vaga.precos[modalidade];
  const titulo = vagaTitulo(vaga);
  const precoTxt = preco != null ? `${formatCents(preco)} por ${modalidadeUnidade[modalidade]}` : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${vagaMedidas(vaga)}. ${precoTxt}. ${aprovacaoLabel(vaga)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.info}>
          <AppText variant="bodyLarge" weight={800}>
            {titulo}
          </AppText>
          <AppText variant="small" tone="muted">
            {vagaMedidas(vaga)}
          </AppText>
          <AppText variant="small" tone="subtle">
            {donoLabel(vaga.dono)}
          </AppText>
        </View>
        {preco != null ? (
          <View style={styles.price}>
            <AppText variant="title" weight={800}>
              {formatCents(preco)}
            </AppText>
            <AppText variant="caption" tone="subtle">
              /{modalidadeUnidade[modalidade]}
            </AppText>
          </View>
        ) : null}
      </View>
      <Badge label={aprovacaoLabel(vaga)} tone={vaga.modo_aprovacao === 'automatica' ? 'lime' : 'neutral'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.cardLarge, padding: spacing.lg, gap: spacing.md },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  info: { flex: 1, minWidth: 180, gap: spacing.xs },
  price: { alignItems: 'flex-end' },
});
