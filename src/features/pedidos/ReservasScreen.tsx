import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { formatCents, formatPeriod } from '@/lib/format';
import { vagaTitulo } from '@/features/explorar/VagaCard';
import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';
import { colors, radius, spacing } from '@/theme/tokens';

import type { PedidoFeito } from './api';
import { usePedidos } from './hooks';
import { estornoBadge, statusLabel, statusTone } from './labels';

/** Minhas reservas: pedidos feitos pela minha unidade (backend D61: responsável e membro veem). */
export function ReservasScreen() {
  const vinculo = useActiveVinculo();
  if (!vinculo.unidade_id) {
    return (
      <Screen title="Reservas" edges={['top']}>
        <AppText tone="muted">Reservas são de quem mora numa unidade do condomínio.</AppText>
      </Screen>
    );
  }
  return <Reservas />;
}

function Reservas() {
  const pedidos = usePedidos();
  return (
    <Screen
      title="Minhas reservas"
      subtitle="Pedidos feitos pela sua unidade"
      edges={['top']}
      onRefresh={() => void pedidos.refetch()}
      refreshing={pedidos.isRefetching}
    >
      {pedidos.isLoading ? <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando reservas" /> : null}
      {pedidos.isError ? (
        <>
          <FormMessage message={userMessage(pedidos.error)} />
          <Button variant="secondary" label="Tentar de novo" onPress={() => void pedidos.refetch()} />
        </>
      ) : null}
      {pedidos.data?.length === 0 ? (
        <Card>
          <AppText tone="muted">Você ainda não pediu nenhuma vaga.</AppText>
          <Button label="Explorar vagas" onPress={() => router.navigate('/')} />
        </Card>
      ) : null}
      {pedidos.data && pedidos.data.length > 0 ? <Secoes pedidos={pedidos.data} /> : null}
    </Screen>
  );
}

/** "Meus" e "da unidade" pelo `feito_por_mim` do backend (D82 do backend, D16 do app). */
function Secoes({ pedidos }: { pedidos: PedidoFeito[] }) {
  const meus = pedidos.filter((p) => p.feito_por_mim);
  const outros = pedidos.filter((p) => !p.feito_por_mim);
  return (
    <>
      {meus.length > 0 ? (
        <AppText variant="small" weight={700} tone="subtle" accessibilityRole="header">
          Meus pedidos
        </AppText>
      ) : null}
      {meus.map((p) => (
        <ItemPedido key={p.id} pedido={p} />
      ))}
      {outros.length > 0 ? (
        <AppText variant="small" weight={700} tone="subtle" accessibilityRole="header">
          De outros moradores da unidade
        </AppText>
      ) : null}
      {outros.map((p) => (
        <ItemPedido key={p.id} pedido={p} />
      ))}
    </>
  );
}

function ItemPedido({ pedido: p }: { pedido: PedidoFeito }) {
  const titulo = vagaTitulo(p.vaga);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        titulo,
        statusLabel(p.status),
        formatPeriod(p.inicio, p.fim),
        p.estorno_status ? estornoBadge[p.estorno_status] : null,
      ]
        .filter(Boolean)
        .join('. ')}
      onPress={() => router.push({ pathname: '/pedido/[id]', params: { id: p.id } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Badge label={statusLabel(p.status)} tone={statusTone(p.status)} />
      <AppText weight={700}>{titulo}</AppText>
      <AppText variant="small" tone="muted">
        {formatPeriod(p.inicio, p.fim)}
      </AppText>
      <AppText variant="small" weight={600}>
        {formatCents(p.total_centavos)}
      </AppText>
      {p.aviso_nao_entregue_aberto ? (
        <AppText variant="small" tone="muted">
          Aviso de vaga não entregue em andamento
        </AppText>
      ) : null}
      {p.estorno_status ? (
        <AppText variant="small" tone="muted">
          {estornoBadge[p.estorno_status]}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, gap: spacing.xs },
  pressed: { opacity: 0.85 },
});
