import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { FormMessage } from '@/components/FormMessage';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { formatCents, formatDateTime, formatPeriod } from '@/lib/format';
import { vagaTitulo } from '@/features/explorar/VagaCard';
import { colors, radius, spacing } from '@/theme/tokens';

import type { PedidoFeito } from './api';
import { useCancelarPedido, usePedido } from './hooks';
import { formaPagamentoLabel, isPendente, statusLabel, statusTone } from './labels';

export function PedidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pedido = usePedido(id);
  if (pedido.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando pedido" />
      </View>
    );
  }
  if (!pedido.data) {
    return (
      <Screen title="Pedido" edges={['bottom']}>
        <FormMessage message={userMessage(pedido.error)} />
        <Button variant="secondary" label="Tentar de novo" onPress={() => void pedido.refetch()} />
      </Screen>
    );
  }
  return <Pedido pedido={pedido.data} />;
}

/** Título e texto por estado. O estado vem do backend; o app só descreve. */
function cabecalho(p: PedidoFeito): { titulo: string; texto: string } {
  const dono = p.dono.primeiro_nome ?? 'o responsável';
  const cartao = p.forma_pagamento === 'cartao';
  switch (p.status) {
    case 'aguardando_dono':
      return {
        titulo: `Aguardando ${dono} responder`,
        texto: cartao
          ? `${formatCents(p.total_centavos)} estão reservados no seu cartão, mas ainda não foram cobrados. Se não houver resposta no prazo, o pedido expira e nada é cobrado.`
          : 'Nada foi cobrado. Se o pedido for aprovado, você recebe o código Pix para pagar.',
      };
    case 'aguardando_pix':
      return {
        titulo: 'Pague com Pix',
        texto: 'Copie o código abaixo no app do seu banco. Se o pagamento não chegar no prazo, o pedido expira.',
      };
    case 'confirmado':
      return { titulo: 'Reserva confirmada', texto: 'Tudo certo. A vaga é sua no período abaixo.' };
    case 'em_uso':
      return { titulo: 'Reserva em andamento', texto: 'O período da reserva já começou.' };
    case 'concluido':
      return { titulo: 'Reserva concluída', texto: 'O período da reserva terminou.' };
    case 'recusado':
      return { titulo: 'Pedido recusado', texto: 'O pedido não foi aprovado. Nada foi cobrado.' };
    case 'expirado':
      return { titulo: 'Pedido expirado', texto: 'O prazo acabou sem resposta ou sem pagamento. Nada foi cobrado.' };
    case 'cancelado':
      return { titulo: 'Pedido cancelado', texto: 'Este pedido foi cancelado.' };
    default:
      return { titulo: statusLabel(p.status), texto: '' };
  }
}

function Pedido({ pedido: p }: { pedido: PedidoFeito }) {
  const qc = useQueryClient();
  const cancelar = useCancelarPedido();
  // Ao zerar o contador, consulta de novo: quem decide se expirou é o backend.
  const onFim = useCallback(() => void qc.invalidateQueries({ queryKey: ['pedidos'] }), [qc]);
  const { titulo, texto } = cabecalho(p);
  const prazo = p.status === 'aguardando_dono' ? p.prazo_resposta_em : p.status === 'aguardando_pix' ? p.pix_expira_em : null;
  const veiculo = p.veiculo ? [p.veiculo.modelo, p.veiculo.porte].filter(Boolean).join(' · ') : '—';

  return (
    <Screen
      edges={['bottom']}
      footer={
        isPendente(p.status) || p.status === 'confirmado' ? (
          <>
            <Button variant="secondary" label="Cancelar pedido (em breve)" disabled={!cancelar.disponivel} />
            <AppText variant="small" tone="subtle" style={styles.centerText}>
              O cancelamento pelo app chega em breve.
            </AppText>
          </>
        ) : null
      }
    >
      <Badge label={statusLabel(p.status)} tone={statusTone(p.status)} />
      <AppText variant="titleLarge">{titulo}</AppText>

      {prazo ? (
        <Card>
          <AppText variant="small" tone="muted">
            Prazo até {formatDateTime(prazo)}
          </AppText>
          <Countdown ate={prazo} onFim={onFim} />
        </Card>
      ) : null}

      {texto ? <AppText tone="muted">{texto}</AppText> : null}

      {p.status === 'aguardando_pix' && p.pix_copia_cola ? (
        <View style={styles.pix}>
          <AppText variant="small" weight={600} tone="muted">
            Pix copia e cola (toque e segure para copiar)
          </AppText>
          <AppText mono selectable variant="small" accessibilityLabel="Código Pix copia e cola">
            {p.pix_copia_cola}
          </AppText>
        </View>
      ) : null}

      <Card>
        <InfoRow label="Vaga" value={vagaTitulo(p.vaga)} />
        <InfoRow label="Período" value={formatPeriod(p.inicio, p.fim)} />
        <InfoRow label="Veículo" value={veiculo} />
        {p.veiculo?.placa ? <InfoRow label="Placa" value={p.veiculo.placa} mono /> : null}
        <InfoRow label="Pagamento" value={`${formaPagamentoLabel(p.forma_pagamento)} · ${formatCents(p.total_centavos)}`} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  centerText: { textAlign: 'center' },
  pix: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
