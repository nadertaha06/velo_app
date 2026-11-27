import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { isApiError, userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { FormMessage } from '@/components/FormMessage';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { formatCents, formatDateTime, formatPeriod } from '@/lib/format';
import { serverNow } from '@/lib/serverClock';
import { vagaTitulo } from '@/features/explorar/VagaCard';
import { colors, radius, spacing } from '@/theme/tokens';

import type { PedidoFeito } from './api';
import { podeCancelar, useCancelarPedido, usePedido } from './hooks';
import { formaPagamentoLabel, reembolsoTexto, statusLabel, statusTone } from './labels';

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
    case 'processando_pagamento':
      return {
        titulo: 'Processando o pagamento',
        texto: 'Estamos confirmando o pagamento com a operadora. Isso costuma levar poucos segundos.',
      };
    case 'aguardando_dono':
      return {
        titulo: `Aguardando ${dono} responder`,
        texto: cartao
          ? `${formatCents(p.total_centavos)} estão reservados no seu cartão, mas ainda não foram cobrados. Se não houver resposta no prazo, o pedido expira e nada é cobrado.`
          : 'Nada foi cobrado. Se o pedido for aprovado, você recebe o código Pix para pagar.',
      };
    case 'aguardando_pix':
      // O copia e cola só vem para quem fez o pedido (backend D65).
      return p.pix_copia_cola
        ? {
            titulo: 'Pague com Pix',
            texto: 'Copie o código abaixo no app do seu banco. Se o pagamento não chegar no prazo, o pedido expira.',
          }
        : {
            titulo: 'Aguardando o Pix',
            texto: 'O pagamento é feito por quem fez o pedido. Se não chegar no prazo, o pedido expira.',
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
      return { titulo: 'Pedido cancelado', texto: textoCancelado(p) };
    case 'nao_entregue':
      return {
        titulo: 'Vaga não entregue',
        texto:
          p.reembolso_centavos != null && p.reembolso_centavos > 0
            ? `A reserva foi encerrada. ${reembolso(p)}`
            : 'A reserva foi encerrada. O reembolso segue a análise do aviso.',
      };
    default:
      return { titulo: statusLabel(p.status), texto: '' };
  }
}

const CANCELADO_POR: Record<string, string> = {
  locatario: 'por quem fez o pedido',
  dono: 'pelo dono da vaga',
  admin: 'pela administração do Velo',
  sistema: 'automaticamente, porque o vínculo com a unidade foi encerrado',
};

/** Reembolso: valor e andamento vêm do backend (`reembolso_centavos`, `estorno_status`). */
function reembolso(p: PedidoFeito): string {
  return reembolsoTexto(p.reembolso_centavos, p.estorno_status, p.feito_por_mim ? 'Você' : 'Quem fez o pedido', formatCents) ?? '';
}

function textoCancelado(p: PedidoFeito): string {
  const quem = p.cancelado_por ? CANCELADO_POR[p.cancelado_por] : null;
  const base = quem ? `Cancelado ${quem}.` : 'Este pedido foi cancelado.';
  if (p.reembolso_centavos == null) return base;
  return `${base} ${reembolso(p)}`;
}

function Pedido({ pedido: p }: { pedido: PedidoFeito }) {
  const qc = useQueryClient();
  const cancelar = useCancelarPedido(p.id);
  const [confirmando, setConfirmando] = useState(false);
  // Ao zerar o contador, consulta de novo: quem decide se expirou é o backend.
  const onFim = useCallback(() => void qc.invalidateQueries({ queryKey: ['pedidos'] }), [qc]);
  const { titulo, texto } = cabecalho(p);
  const prazo = p.status === 'aguardando_dono' ? p.prazo_resposta_em : p.status === 'aguardando_pix' ? p.pix_expira_em : null;
  const veiculo = p.veiculo ? [p.veiculo.modelo, p.veiculo.porte].filter(Boolean).join(' · ') : '—';

  return (
    <Screen
      edges={['bottom']}
      footer={
        // Só quem fez o pedido cancela (backend D82); os outros moradores só acompanham.
        p.feito_por_mim && podeCancelar(p.status) ? (
          confirmando ? (
            <>
              <AppText variant="small" tone="muted">
                Antes do início, você recebe de volta o que foi pago, menos a taxa de serviço. Depois do
                início, não há reembolso. Se ainda não houve cobrança, nada é cobrado. O valor exato
                aparece depois do cancelamento.
              </AppText>
              <FormMessage message={cancelar.error ? erroCancelar(cancelar.error) : null} />
              <Button
                label="Confirmar cancelamento"
                loading={cancelar.isPending}
                onPress={() => cancelar.mutate(undefined, { onSuccess: () => setConfirmando(false) })}
              />
              <Button variant="ghost" label="Voltar" onPress={() => setConfirmando(false)} />
            </>
          ) : (
            <Button variant="secondary" label="Cancelar pedido" onPress={() => setConfirmando(true)} />
          )
        ) : null
      }
    >
      <Badge label={statusLabel(p.status)} tone={statusTone(p.status)} />
      <AppText variant="titleLarge">{titulo}</AppText>
      {!p.feito_por_mim ? (
        <AppText variant="small" tone="subtle">
          Pedido feito por outro morador da sua unidade. Só quem fez o pedido pode cancelar ou avisar
          problema.
        </AppText>
      ) : null}

      {prazo ? (
        <Card>
          <AppText variant="small" tone="muted">
            Prazo até {formatDateTime(prazo)}
          </AppText>
          <Countdown ate={prazo} onFim={onFim} now={serverNow} />
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

/** 404 aqui: o pedido é de outro morador da unidade (só quem fez cancela, backend D72). */
function erroCancelar(err: unknown): string {
  if (isApiError(err, 'not_found')) return 'Só quem fez o pedido pode cancelar.';
  return userMessage(err);
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  pix: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
