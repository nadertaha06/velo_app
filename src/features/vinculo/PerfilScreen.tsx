import { router } from 'expo-router';

import { session } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';

import { vinculoLabel } from './resolve';
import { useActiveVinculo } from './useActiveVinculo';
import { useVinculo } from './VinculoProvider';

/**
 * Perfil provisório: onde a pessoa está, troca de vínculo, convite e sair.
 * Veículos, senha, e-mail, exportar e excluir conta entram na etapa 4.
 */
export function PerfilScreen() {
  const vinculo = useActiveVinculo();
  const { state } = useVinculo();
  const { title, detail } = vinculoLabel(vinculo);
  const varios = 'all' in state && state.all.length > 1;

  return (
    <Screen title="Perfil" edges={['top']}>
      <Card>
        <AppText weight={700}>{title}</AppText>
        <AppText variant="small" tone="muted">
          {detail}
        </AppText>
      </Card>
      {varios ? (
        <Button
          variant="secondary"
          label="Trocar condomínio ou unidade"
          onPress={() => router.push('/escolher-vinculo')}
        />
      ) : null}
      <Button variant="ghost" label="Aceitar outro convite" onPress={() => router.push('/aceitar-convite')} />
      <Button variant="ghost" label="Sair" onPress={() => void session.signOut()} />
    </Screen>
  );
}
