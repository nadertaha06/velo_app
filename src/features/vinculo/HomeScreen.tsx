import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { session } from '@/api/client';
import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/tokens';

import { ChooseVinculoScreen } from './ChooseVinculoScreen';
import { vinculoLabel } from './resolve';
import { useVinculo } from './VinculoProvider';

/**
 * Início provisório da etapa 1: resolve o vínculo e mostra onde a pessoa entrou.
 * As abas (Explorar, Reservas, Perfil) entram nas etapas 2 a 4.
 */
export function HomeScreen() {
  const { state } = useVinculo();
  const signOut = <Button variant="ghost" label="Sair" onPress={() => void session.signOut()} />;

  if (state.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} accessibilityLabel="Carregando" />
      </View>
    );
  }
  if (state.kind === 'error') {
    return (
      <Screen title="Não deu para carregar">
        <FormMessage message={userMessage(state.error)} />
        <Button label="Tentar de novo" onPress={state.retry} />
        {signOut}
      </Screen>
    );
  }
  if (state.kind === 'choose') return <ChooseVinculoScreen />;
  if (state.kind === 'none') {
    return (
      <Screen title="Sem acesso ainda">
        <AppText tone="muted">
          Sua conta ainda não está ligada a nenhum condomínio. Peça um convite ao síndico ou ao
          responsável da sua unidade.
        </AppText>
        <Button label="Tenho um convite" onPress={() => router.push('/aceitar-convite')} />
        {signOut}
      </Screen>
    );
  }

  const { title, detail } = vinculoLabel(state.vinculo);
  return (
    <Screen title={title} subtitle={detail}>
      <Card>
        <AppText tone="muted">As telas de vagas e reservas chegam na próxima etapa.</AppText>
      </Card>
      {state.all.length > 1 ? (
        <Button
          variant="secondary"
          label="Trocar condomínio ou unidade"
          onPress={() => router.push('/escolher-vinculo')}
        />
      ) : null}
      <Button variant="ghost" label="Aceitar outro convite" onPress={() => router.push('/aceitar-convite')} />
      {signOut}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
