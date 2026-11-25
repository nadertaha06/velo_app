import { Stack } from 'expo-router';

import { VinculoProvider } from '@/features/vinculo/VinculoProvider';
import { colors } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <VinculoProvider>
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </VinculoProvider>
  );
}
