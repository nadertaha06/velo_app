import { Stack } from 'expo-router';

import { FiltroProvider } from '@/features/explorar/FiltroProvider';
import { vinculoKey } from '@/features/vinculo/resolve';
import { VinculoGate } from '@/features/vinculo/VinculoGate';
import { useVinculo, VinculoProvider } from '@/features/vinculo/VinculoProvider';
import { colors } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <VinculoProvider>
      <VinculoGate>
        <AppStack />
      </VinculoGate>
    </VinculoProvider>
  );
}

function AppStack() {
  const { state } = useVinculo();
  // Trocar de vínculo zera o filtro (veículo e período são escolhas daquele contexto).
  const key = state.kind === 'chosen' ? vinculoKey(state.vinculo) : 'none';
  return (
    <FiltroProvider key={key}>
      <Stack
        screenOptions={{
          headerTitle: '',
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.bg },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="filtro" options={{ presentation: 'modal' }} />
        <Stack.Screen name="veiculo-novo" options={{ presentation: 'modal' }} />
      </Stack>
    </FiltroProvider>
  );
}
