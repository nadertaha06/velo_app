import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { vagaTitulo } from '@/features/explorar/VagaCard';
import { estornoBadge, statusLabel, statusTone } from '@/features/pedidos/labels';
import { formatCents, formatPeriod } from '@/lib/format';
import { serverNow } from '@/lib/serverClock';
import { colors, radius, spacing } from '@/theme/tokens';

import type { PedidoRecebido } from './api';
import { useRecebidos } from './hooks';
import { locatarioTexto } from './RecebidoScreen';

/** Pedidos da vaga da unidade (só o responsável vê esta aba). Os que esperam resposta vêm antes. */
export function RecebidosScreen() {
  const pedidos = useRecebidos();
  const aguardando = pedidos.data?.filter((p) => p.status === 'aguardando_dono') ?? [];
  const outros = pedidos.data?.filter((p) => p.status !== 'aguardando_dono') ?? [];
  return (
    <Screen
      title="Pedidos recebidos"
      subtitle="Pedidos da vaga da sua unidade"
      edges={['top']}
      onRefresh={() => void pedidos.refetch()}
      refreshing={pedidos.isRefetching}
    >
      {pedidos.isLoading ? <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando pedidos" /> : null}
      {pedidos.isError ? (
        <>
          <FormMessage message={userMessage(pedidos.error)} />
          <Button variant="secondary" label="Tentar de novo" onPress={() => void pedidos.refetch()} />
        </>
      ) : null}
      {pedidos.data?.length === 0 ? (
        <Card>
          <AppText tone="muted">Nenhum pedido ainda. Anuncie a vaga em Perfil › Minha unidade.</AppText>
        </Card>
      ) : null}
      {aguardando.length > 0 ? (
        <AppText variant="small" weight={700} tone="subtle" accessibilityRole="header">
          Esperando sua resposta
        </AppText>
      ) : null}
      {aguardando.map((p) => (
        <Item key={p.id} pedido={p} />
      ))}
      {outros.length > 0 ? (
        <AppText variant="small" weight={700} tone="subtle" accessibilityRole="header">
          Outros pedidos
        </AppText>
      ) : null}
      {outros.map((p) => (
        <Item key={p.id} pedido={p} />
      ))}
    </Screen>
  );
}

function Item({ pedido: p }: { pedido: PedidoRecebido }) {
  const novo = p.status === 'aguardando_dono';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${locatarioTexto(p)}. ${vagaTitulo(p.vaga)}. ${novo ? 'Novo pedido' : statusLabel(p.status)}. ${formatPeriod(p.inicio, p.fim)}`}
      onPress={() => router.push({ pathname: '/recebido/[id]', params: { id: p.id } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Badge label={novo ? 'Novo pedido' : statusLabel(p.status)} tone={statusTone(p.status)} />
      <AppText weight={700}>{locatarioTexto(p)}</AppText>
      <AppText variant="small" tone="muted">
        {vagaTitulo(p.vaga)} · {formatPeriod(p.inicio, p.fim)}
      </AppText>
      <AppText variant="small" weight={600}>
        Você recebe {formatCents(p.valor_dono_centavos)}
      </AppText>
      {novo && p.prazo_resposta_em ? <Countdown ate={p.prazo_resposta_em} now={serverNow} /> : null}
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
