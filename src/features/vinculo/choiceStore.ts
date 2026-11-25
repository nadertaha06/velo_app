import * as SecureStore from 'expo-secure-store';

/** Guarda só a chave do vínculo escolhido (não é dado pessoal). */
const KEY = 'velo.vinculo';

export const choiceStore = {
  get: (): Promise<string | null> => SecureStore.getItemAsync(KEY),
  set: (key: string): Promise<void> => SecureStore.setItemAsync(KEY, key),
  clear: (): Promise<void> => SecureStore.deleteItemAsync(KEY),
};
