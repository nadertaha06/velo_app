import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { session } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import { useSessionStatus } from '@/auth/useSession';
import { OfflineScreen } from '@/features/auth/OfflineScreen';
import { fontAssets } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const status = useSessionStatus();

  useEffect(() => {
    void session.restore();
  }, []);

  const ready = (fontsLoaded || !!fontError) && status !== 'loading';
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {status === 'offline' ? (
          <OfflineScreen onRetry={() => void session.restore()} />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            {/* A permissão real é do backend; isto só escolhe o que mostrar. */}
            <Stack.Protected guard={status === 'signedIn'}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Protected guard={status !== 'signedIn'}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
