import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { vagaTitulo } from '@/features/explorar/VagaCard';
import { podeTerAviso } from '@/features/naoEntrega/api';
import { AvisoDonoCard } from '@/features/naoEntrega/AvisoCard';
import { useAviso } from '@/features/naoEntrega/hooks';
import { isPorte, porteLabel, quantidadeLabel, reembolsoTexto, statusLabel, statusTone } from '@/features/pedidos/labels';
import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';
import { formatCents, formatDateTime, formatPeriod } from '@/lib/format';
import { serverNow } from '@/lib/serverClock';
import { colors, spacing } from '@/theme/tokens';

import type { PedidoRecebido } from './api';
import { useAcaoRecebido, useRecebido, type AcaoRecebido } from './hooks';

export function RecebidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pedido = useRecebido(id);
  if (pedido.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando pedido" />
      </View>
    );
  }
  if (!pedido.data) {
    return (
      <Screen title="Pedido recebido" edges={['bottom']}>
        <FormMessage message={userMessage(pedido.error)} />
        <Button variant="secondary" label="Tentar de novo" onPress={() => void pedido.refetch()} />
      </Screen>
    );
  }
  return <Recebido pedido={pedido.data} />;
}

export function locatarioTexto(p: Pick<PedidoRecebido, 'locatario'>): string {
  const l = p.locatario;
  const unidade = `Ap. ${l.numero}, Bloco ${l.bloco}`;
  return l.primeiro_nome ? `${l.primeiro_nome} · ${unidade}` : unidade;
}

/** Prazo do dono pela modalidade (backend D72): só texto, quem decide é o backend. */
function prazoCancelarDono(modalidade: string): string {
  return modalidade === 'dia' ? '24 h' : '3 dias';
}

function Recebido({ pedido: p }: { pedido: PedidoRecebido }) {
  const qc = useQueryClient();
  const v = useActiveVinculo();
  const responsavel = v.papel === 'responsavel';
  const aprovar = useAcaoRecebido(p.id, 'aprovar');
  const recusar = useAcaoRecebido(p.id, 'recusar');
  const cancelar = useAcaoRecebido(p.id, 'cancelar');
  const [confirmando, setConfirmando] = useState<AcaoRecebido | null>(null);
  const aviso = useAviso('recebido', p.id, podeTerAviso(p.status));
  const onFim = useCallback(() => void qc.invalidateQueries({ queryKey: ['recebidos'] }), [qc]);
  const novo = p.status === 'aguardando_dono';
  const erro = aprovar.error ?? recusar.error ?? cancelar.error;
  const quem = p.locatario.primeiro_nome ?? 'Quem pediu';
  const nome = p.veiculo?.modelo ?? null;
  const reembolso = reembolsoTexto(p.reembolso_centavos, p.estorno_status, 'Quem alugou', formatCents);

  const footer = !responsavel ? null : novo ? (
    confirmando === 'recusar' ? (
      <>
        <AppText variant="small" tone="muted">
          {p.forma_pagamento === 'cartao'
            ? 'O valor reservado no cartão é liberado e nada é cobrado.'
            : 'Nada foi cobrado.'}
        </AppText>
        <Button label="Confirmar recusa" loading={recusar.isPending} onPress={() => recusar.mutate()} />
        <Button variant="ghost" label="Voltar" onPress={() => setConfirmando(null)} />
      </>
    ) : (
      <View style={styles.linha}>
        <View style={styles.flex}>
          <Button variant="secondary" label="Recusar" onPress={() => setConfirmando('recusar')} />
        </View>
        <View style={styles.flex}>
          <Button label="Aprovar" loading={aprovar.isPending} onPress={() => aprovar.mutate()} />
        </View>
      </View>
    )
  ) : p.status === 'confirmado' ? (
    confirmando === 'cancelar' ? (
      <>
        <AppText variant="small" tone="muted">
          Quem alugou recebe tudo de volta, inclusive a taxa. Cada cancelamento seu conta para a
          suspensão da vaga.
        </AppText>
        <Button label="Confirmar cancelamento" loading={cancelar.isPending} onPress={() => cancelar.mutate()} />
        <Button variant="ghost" label="Voltar" onPress={() => setConfirmando(null)} />
      </>
    ) : (
      <Button variant="secondary" label="Cancelar reserva" onPress={() => setConfirmando('cancelar')} />
    )
  ) : null;

  return (
    <Screen edges={['bottom']} footer={footer ? <>{erro ? <FormMessage message={userMessage(erro)} /> : null}{footer}</> : null}>
      <Badge label={novo ? 'Novo pedido' : statusLabel(p.status)} tone={statusTone(p.status)} />
      <AppText variant="titleLarge">{novo ? 'Pedido recebido' : statusLabel(p.status)}</AppText>

      {novo && p.prazo_resposta_em ? (
        <Card>
          <AppText variant="small" tone="muted">
            Responda até {formatDateTime(p.prazo_resposta_em)}. Sem resposta, o pedido expira.
          </AppText>
          <Countdown ate={p.prazo_resposta_em} onFim={onFim} now={serverNow} />
        </Card>
      ) : null}

      {aviso.data ? <AvisoDonoCard pedidoId={p.id} aviso={aviso.data} /> : null}

      <Card>
        <AppText weight={700}>{locatarioTexto(p)}</AppText>
        <InfoRow label="Vaga" value={vagaTitulo(p.vaga)} />
        <InfoRow label="Período" value={formatPeriod(p.inicio, p.fim)} />
        <InfoRow
          label="Veículo"
          value={p.veiculo ? `Porte ${isPorte(p.veiculo.porte) ? porteLabel[p.veiculo.porte] : p.veiculo.porte}` : '—'}
        />
        {/* Placa e modelo só quando a API devolve (depois de confirmado, spec do app, seção 4). */}
        {p.veiculo?.placa ? (
          <>
            <InfoRow label="Placa" value={p.veiculo.placa} mono />
            {nome ? <InfoRow label="Modelo" value={nome} /> : null}
          </>
        ) : (
          <InfoRow label="Placa e modelo" value="Liberados depois que você aprovar" />
        )}
      </Card>

      {p.mensagem ? <AppText>“{p.mensagem}”</AppText> : null}

      <Card>
        <InfoRow
          label={`${quantidadeLabel(p.modalidade, p.quantidade)} × ${formatCents(p.preco_unitario_centavos)}`}
          value={formatCents(p.total_centavos)}
        />
        <InfoRow label="Taxa Velo" value={`− ${formatCents(p.taxa_centavos)}`} />
        <InfoRow label="Você recebe" value={formatCents(p.valor_dono_centavos)} />
      </Card>

      {novo ? (
        <AppText variant="small" tone="muted">
          Depois de aprovar, você só pode cancelar até {prazoCancelarDono(p.modalidade)} antes do início, e
          cada cancelamento conta para a suspensão da vaga.{' '}
          {p.forma_pagamento === 'cartao'
            ? `${quem} já reservou o valor no cartão.`
            : 'O Pix é gerado para quem pediu depois que você aprovar.'}
        </AppText>
      ) : null}
      {p.status === 'cancelado' && reembolso ? <AppText tone="muted">{reembolso}</AppText> : null}
      {!responsavel ? (
        <AppText variant="small" tone="subtle">
          Só o responsável da unidade aprova, recusa ou cancela.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  linha: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
