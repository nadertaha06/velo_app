import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { vinculoLabel } from '@/features/vinculo/resolve';
import { useActiveVinculo } from '@/features/vinculo/useActiveVinculo';
import { modalidadeChip } from '@/features/pedidos/labels';
import { colors } from '@/theme/tokens';

import { useFiltro } from './FiltroProvider';
import { useVagas } from './hooks';
import { ModalidadeChips } from './ModalidadeChips';
import { ResumoFiltro } from './ResumoFiltro';
import { VagaCard } from './VagaCard';
import { visibleVagas } from './visible';

export function ExplorarScreen() {
  const vinculo = useActiveVinculo();
  if (!vinculo.unidade_id) return <SemUnidade />;
  return <Explorar />;
}

function SemUnidade() {
  const vinculo = useActiveVinculo();
  return (
    <Screen title="Vagas livres" subtitle={vinculoLabel(vinculo).title} edges={['top']}>
      <AppText tone="muted">Alugar vaga é para quem mora numa unidade do condomínio.</AppText>
    </Screen>
  );
}

function Explorar() {
  const vinculo = useActiveVinculo();
  const filtro = useFiltro();
  const vagas = useVagas();
  const lista = vagas.data ? visibleVagas(vagas.data, filtro.modalidade) : [];
  const { title, detail } = vinculoLabel(vinculo);

  return (
    <Screen
      title="Vagas livres"
      subtitle={[title, detail].join(' · ')}
      edges={['top']}
      onRefresh={() => void vagas.refetch()}
      refreshing={vagas.isRefetching}
    >
      <ModalidadeChips value={filtro.modalidade} onChange={(m) => filtro.set({ modalidade: m, quantidade: 1 })} />
      <ResumoFiltro onEditar={() => router.push('/filtro')} />

      {vagas.isLoading ? <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando vagas" /> : null}
      {vagas.isError ? (
        <>
          <FormMessage message={userMessage(vagas.error)} />
          <Button variant="secondary" label="Tentar de novo" onPress={() => void vagas.refetch()} />
        </>
      ) : null}

      {vagas.data ? (
        <AppText variant="small" weight={600} tone="muted" accessibilityLiveRegion="polite">
          {lista.length === 0
            ? `Nenhuma vaga com ${modalidadeChip[filtro.modalidade].toLowerCase()} por enquanto.`
            : `${lista.length} ${lista.length === 1 ? 'vaga anunciada' : 'vagas anunciadas'} · confira porte e período no detalhe`}
        </AppText>
      ) : null}

      {lista.map((v) => (
        <VagaCard
          key={v.id}
          vaga={v}
          modalidade={filtro.modalidade}
          onPress={() => router.push({ pathname: '/vaga/[id]', params: { id: v.id } })}
        />
      ))}

      {vagas.data && lista.length === 0 ? (
        <Card>
          <AppText tone="muted">Puxe para atualizar ou troque a modalidade acima.</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
