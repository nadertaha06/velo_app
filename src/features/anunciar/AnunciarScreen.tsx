import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/theme/tokens';

import type { VagaGestao } from './api';
import { useSalvarVaga, useVagaGestao } from './hooks';
import { dadosIniciais, dadosParaApi, PassoDados, type Dados } from './PassoDados';
import { PassoDisponibilidade } from './PassoDisponibilidade';
import { PassoFotos } from './PassoFotos';
import { PassoPrecos, type PrecosAprovacao } from './PassoPrecos';

const PASSOS = ['Dados da vaga', 'Preços e aprovação', 'Fotos da vaga', 'Disponibilidade'] as const;

/** Anunciar (`id = nova`) ou editar uma vaga da unidade. Só o responsável chega aqui. */
export function AnunciarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nova = id === 'nova';
  const vaga = useVagaGestao(nova ? null : id);
  if (!nova && vaga.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando vaga" />
      </View>
    );
  }
  if (!nova && !vaga.data) {
    return (
      <Screen title="Vaga" edges={['bottom']}>
        <FormMessage message={userMessage(vaga.error)} />
        <Button variant="secondary" label="Tentar de novo" onPress={() => void vaga.refetch()} />
      </Screen>
    );
  }
  return <Assistente inicial={vaga.data} />;
}

/**
 * A vaga nasce no passo 2 (o backend exige dados, preços e modo de aprovação
 * juntos), **pausada** (`ativa: false`). Fotos e disponibilidade precisam da vaga
 * criada. No fim, publicar liga o anúncio (`ativa: true`). Ver D24.
 */
function Assistente({ inicial }: { inicial: VagaGestao | undefined }) {
  const [vagaId, setVagaId] = useState<string | null>(inicial?.id ?? null);
  const atual = useVagaGestao(vagaId);
  const vaga = atual.data ?? inicial;
  const [passo, setPasso] = useState(0);
  const [dados, setDados] = useState<Dados>(() => dadosIniciais(inicial));
  const salvar = useSalvarVaga();
  const editando = !!inicial;

  function salvarPrecos(p: PrecosAprovacao) {
    const body = { ...dadosParaApi(dados), ...p };
    salvar.mutate(
      { vagaId, body: vagaId ? body : { ...body, ativa: false } },
      {
        onSuccess: (v) => {
          setVagaId(v.id);
          setPasso(2);
        },
      },
    );
  }

  function publicar(ativa: boolean) {
    if (!vagaId) return;
    salvar.mutate({ vagaId, body: { ativa } }, { onSuccess: () => router.back() });
  }

  const final = vaga ? (
    <>
      <FormMessage message={salvar.error ? userMessage(salvar.error) : null} />
      {vaga.ativa ? (
        <>
          <Button label="Concluir" onPress={() => router.back()} />
          <Button variant="secondary" label="Pausar anúncio" loading={salvar.isPending} onPress={() => publicar(false)} />
        </>
      ) : (
        <Button label="Publicar vaga" loading={salvar.isPending} onPress={() => publicar(true)} />
      )}
    </>
  ) : null;

  return (
    <Screen
      title={PASSOS[passo]}
      subtitle={`${editando ? 'Editar vaga' : 'Anunciar vaga'} · passo ${passo + 1} de ${PASSOS.length}`}
      edges={['bottom']}
    >
      {editando ? (
        <View style={styles.chips}>
          {PASSOS.map((nome, i) => (
            <Chip key={nome} label={`${i + 1}`} selected={passo === i} onPress={() => setPasso(i)} />
          ))}
        </View>
      ) : null}
      {passo === 0 ? (
        <PassoDados
          inicial={dados}
          onContinuar={(d) => {
            setDados(d);
            setPasso(1);
          }}
        />
      ) : null}
      {passo === 1 ? (
        <PassoPrecos
          vaga={vaga}
          salvando={salvar.isPending}
          erro={salvar.error ? userMessage(salvar.error) : null}
          onVoltar={() => setPasso(0)}
          onSalvar={salvarPrecos}
        />
      ) : null}
      {passo === 2 && vaga ? <PassoFotos vaga={vaga} onVoltar={() => setPasso(1)} onContinuar={() => setPasso(3)} /> : null}
      {passo === 3 && vaga ? <PassoDisponibilidade vaga={vaga} final={final} onVoltar={() => setPasso(2)} /> : null}
      {passo >= 2 && !vaga ? (
        <AppText tone="muted">Salve os preços antes de seguir.</AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  chips: { flexDirection: 'row', gap: spacing.sm },
});
