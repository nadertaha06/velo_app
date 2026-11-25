import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { session } from '@/api/client';
import { userMessage } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/tokens';

import { AcceptInviteForm } from './AcceptInviteScreen';
import { ChooseVinculoScreen } from './ChooseVinculoScreen';
import { useVinculo } from './VinculoProvider';

/**
 * Só mostra o app depois de resolver o vínculo (D2): um só entra direto; vários,
 * pergunta; nenhum, oferece aceitar convite. A permissão real continua no backend.
 */
export function VinculoGate({ children }: { children: ReactNode }) {
  const { state } = useVinculo();
  const sair = <Button variant="ghost" label="Sair" onPress={() => void session.signOut()} />;

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
        {sair}
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
        <AcceptInviteForm />
        {sair}
      </Screen>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
