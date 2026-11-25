import * as SecureStore from 'expo-secure-store';

/**
 * Refresh token só no SecureStore (Keychain no iOS), nunca no AsyncStorage
 * (spec, seção 5). O access token fica só em memória (session.ts).
 */
const KEY = 'velo.refresh_token';

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const refreshStore = {
  get: (): Promise<string | null> => SecureStore.getItemAsync(KEY, options),
  set: (token: string): Promise<void> => SecureStore.setItemAsync(KEY, token, options),
  clear: (): Promise<void> => SecureStore.deleteItemAsync(KEY, options),
};
