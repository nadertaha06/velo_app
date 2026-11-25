import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { InfoRow } from '@/components/InfoRow';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { formatCents, formatShort } from '@/lib/format';
import {
  isModalidade,
  modalidadeChip,
  modalidadeUnidade,
  quantidadeLabel,
  type Modalidade,
} from '@/features/pedidos/labels';
import { useVeiculoEscolhido } from '@/features/veiculos/useVeiculoEscolhido';
import { colors, minTouch, radius, spacing } from '@/theme/tokens';

import type { Cotacao, VagaAnuncio } from './api';
import { useFiltro } from './FiltroProvider';
import { Fotos } from './Fotos';
import { useCotacao, useVaga } from './hooks';
import { ModalidadeChips } from './ModalidadeChips';
import { aprovacaoLabel, donoLabel, vagaMedidas, vagaTitulo } from './VagaCard';

export function DetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vaga = useVaga(id);

  if (vaga.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando vaga" />
      </View>
    );
  }
  if (!vaga.data) {
    return (
      <Screen title="Vaga" edges={['bottom']}>
        <FormMessage message={userMessage(vaga.error)} />
        <Button variant="secondary" label="Tentar de novo" onPress={() => void vaga.refetch()} />
      </Screen>
    );
  }
  return <Detalhe vaga={vaga.data} />;
}

function Detalhe({ vaga }: { vaga: VagaAnuncio }) {
  const filtro = useFiltro();
  const { veiculo } = useVeiculoEscolhido();
  const ligada = vaga.precos[filtro.modalidade] != null;
  const cotacao = useCotacao(
    vaga.id,
    { modalidade: filtro.modalidade, quantidade: filtro.quantidade, inicio: filtro.inicio },
    ligada,
  );
  const nomeDono = vaga.dono.primeiro_nome ?? 'o responsável';
  const automatica = vaga.modo_aprovacao === 'automatica';
  const podePedir = ligada && !!cotacao.data && !cotacao.isError && !cotacao.isFetching && !!veiculo;

  return (
    <Screen
      edges={['bottom']}
      footer={
        <>
          {!veiculo ? (
            <Button label="Escolher veículo" onPress={() => router.push('/filtro')} />
          ) : (
            <Button
              label="Pedir vaga"
              disabled={!podePedir}
              onPress={() => router.push({ pathname: '/pagamento/[vagaId]', params: { vagaId: vaga.id } })}
            />
          )}
          <AppText variant="small" tone="muted" style={styles.center}>
            {automatica
              ? 'Reserva instantânea: confirmada assim que o pagamento for aceito.'
              : `Você só é cobrado se ${nomeDono} aprovar.`}
          </AppText>
        </>
      }
    >
      <Fotos fotos={vaga.fotos} />
      <AppText variant="title">{vagaTitulo(vaga)}</AppText>
      <AppText tone="muted">{vagaMedidas(vaga, true)}</AppText>
      <Card>
        <AppText weight={700}>{donoLabel(vaga.dono)}</AppText>
        <Badge label={aprovacaoLabel(vaga)} tone={automatica ? 'lime' : 'neutral'} />
      </Card>

      <AppText variant="bodyLarge" weight={700}>
        Modalidade
      </AppText>
      <ModalidadeChips
        value={filtro.modalidade}
        onChange={(m) => filtro.set({ modalidade: m, quantidade: 1 })}
        disabled={(m) => vaga.precos[m] == null}
        label={(m) => {
          const p = vaga.precos[m];
          return p == null ? `${modalidadeChip[m]}: off` : `${formatCents(p)} /${modalidadeUnidade[m]}`;
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Início: ${formatShort(filtro.inicio)}. Alterar`}
        onPress={() => router.push('/filtro')}
        style={styles.inicio}
      >
        <InfoRow label="Início" value={formatShort(filtro.inicio)} />
      </Pressable>

      <Stepper
        label={quantidadeLabel(filtro.modalidade, filtro.quantidade)}
        unidade={modalidadeUnidade[filtro.modalidade]}
        value={filtro.quantidade}
        min={1}
        max={366}
        onChange={(q) => filtro.set({ quantidade: q })}
      />

      {!ligada ? (
        <FormMessage tone="info" message={`Esta vaga não aceita ${modalidadeChip[filtro.modalidade].toLowerCase()}.`} />
      ) : cotacao.isError ? (
        <FormMessage message={userMessage(cotacao.error)} />
      ) : cotacao.data ? (
        <ResumoCotacao cotacao={cotacao.data} carregando={cotacao.isFetching} />
      ) : (
        <ActivityIndicator color={colors.ink} accessibilityLabel="Calculando" />
      )}
    </Screen>
  );
}

function ResumoCotacao({ cotacao, carregando }: { cotacao: Cotacao; carregando: boolean }) {
  const filtro = useFiltro();
  const sugestao = cotacao.mais_barata;
  return (
    <View style={[styles.cotacao, carregando && styles.carregando]} accessibilityLiveRegion="polite">
      <InfoRow label="Termina em" value={formatShort(cotacao.fim)} />
      {sugestao && isModalidade(sugestao.modalidade) ? (
        <Card>
          <AppText variant="small">
            {`${quantidadeLabel(sugestao.modalidade, sugestao.quantidade)} sai mais barato: ${formatCents(
              sugestao.total_centavos,
            )} em vez de ${formatCents(cotacao.total_centavos)}.`}
          </AppText>
          <Button
            variant="secondary"
            label={`Usar ${modalidadeChip[sugestao.modalidade as Modalidade].toLowerCase()}`}
            onPress={() => filtro.set({ modalidade: sugestao.modalidade as Modalidade, quantidade: sugestao.quantidade })}
          />
        </Card>
      ) : null}
      <View style={styles.total}>
        <AppText variant="small" tone="muted">
          {quantidadeLabel(cotacao.modalidade, cotacao.quantidade)}
        </AppText>
        <AppText variant="titleLarge">{formatCents(cotacao.total_centavos)}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  inicio: {
    minHeight: minTouch,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cotacao: { gap: spacing.md },
  carregando: { opacity: 0.6 },
  total: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm },
});
