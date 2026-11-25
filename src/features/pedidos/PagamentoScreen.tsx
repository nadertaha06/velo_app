import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { formatCents, formatPeriod } from '@/lib/format';
import { idempotencyKey } from '@/lib/randomId';
import { useFiltro } from '@/features/explorar/FiltroProvider';
import { useCotacao, useVaga } from '@/features/explorar/hooks';
import { vagaTitulo } from '@/features/explorar/VagaCard';
import { useVeiculoEscolhido } from '@/features/veiculos/useVeiculoEscolhido';
import { metodoLabel, quandoCobra } from '@/payments/labels';
import { paymentProvider } from '@/payments/provisorio';
import { PagamentoIndisponivelError, type MetodoPagamento } from '@/payments/types';
import { colors, spacing } from '@/theme/tokens';

import { useCriarPedido } from './hooks';
import { quantidadeLabel } from './labels';

export function PagamentoScreen() {
  const { vagaId } = useLocalSearchParams<{ vagaId: string }>();
  const filtro = useFiltro();
  const vaga = useVaga(vagaId);
  const { veiculo } = useVeiculoEscolhido();
  const cotacao = useCotacao(
    vagaId,
    { modalidade: filtro.modalidade, quantidade: filtro.quantidade, inicio: filtro.inicio },
    true,
  );
  const criar = useCriarPedido();
  const metodos = paymentProvider.metodos();
  const [metodo, setMetodo] = useState<MetodoPagamento>(
    () => metodos.find((m) => paymentProvider.disponivel(m)) ?? 'pix',
  );
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  // Mesma chave em todas as tentativas deste envio; muda se o conteúdo mudar
  // (senão o backend responde `idempotency_key_reused`).
  const key = useMemo(
    () => idempotencyKey(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a chave depende só do conteúdo do pedido.
    [metodo, vagaId, filtro.modalidade, filtro.quantidade, filtro.inicio, veiculo?.id],
  );

  if (!vaga.data || !cotacao.data) {
    return (
      <Screen edges={['bottom']}>
        {vaga.isError || cotacao.isError ? (
          <FormMessage message={userMessage(vaga.error ?? cotacao.error)} />
        ) : (
          <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando" />
        )}
      </Screen>
    );
  }

  const v = vaga.data;
  const c = cotacao.data;
  const dono = v.dono.primeiro_nome ?? 'o responsável';
  const automatica = v.modo_aprovacao === 'automatica';

  async function enviar() {
    if (!veiculo) return;
    setErroLocal(null);
    try {
      const dados = await paymentProvider.preparar(metodo);
      criar.mutate(
        {
          key,
          body: {
            vaga_id: v.id,
            veiculo_id: veiculo.id,
            modalidade: c.modalidade,
            quantidade: c.quantidade,
            inicio: c.inicio,
            ...dados,
          },
        },
        { onSuccess: (p) => router.replace({ pathname: '/pedido/[id]', params: { id: p.id } }) },
      );
    } catch (err) {
      setErroLocal(err instanceof PagamentoIndisponivelError ? err.message : userMessage(err));
    }
  }

  return (
    <Screen
      title="Como você paga?"
      edges={['bottom']}
      footer={
        <Button
          label={`Enviar pedido com ${metodoLabel[metodo]}`}
          loading={criar.isPending}
          disabled={!veiculo || !paymentProvider.disponivel(metodo)}
          onPress={() => void enviar()}
        />
      }
    >
      <Card>
        <AppText weight={700}>{vagaTitulo(v)}</AppText>
        <AppText variant="small" tone="muted">
          {quantidadeLabel(c.modalidade, c.quantidade)}
        </AppText>
        <AppText variant="small" tone="muted">
          {formatPeriod(c.inicio, c.fim)}
        </AppText>
        <AppText variant="title">{formatCents(c.total_centavos)}</AppText>
      </Card>

      <FormMessage message={erroLocal ?? (criar.error ? userMessage(criar.error) : null)} />

      <AppText variant="bodyLarge" weight={700}>
        Forma de pagamento
      </AppText>
      <View style={styles.opcoes} accessibilityRole="radiogroup">
        {metodos.map((m) => {
          const ok = paymentProvider.disponivel(m);
          return (
            <OptionCard
              key={m}
              title={ok ? metodoLabel[m] : `${metodoLabel[m]} (em breve)`}
              description={quandoCobra(m, automatica, dono)}
              selected={m === metodo}
              disabled={!ok}
              onPress={() => setMetodo(m)}
            />
          );
        })}
      </View>

      <AppText variant="small" tone="muted">
        {`Cancelando antes do início, você recebe tudo de volta, menos a taxa de serviço. Se ${dono} cancelar, você recebe 100%.`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({ opcoes: { gap: spacing.md } });
