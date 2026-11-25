// SecureStore em memória nos testes.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (k) => (store.has(k) ? store.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void store.delete(k)),
    __store: store,
  };
});
process.env.EXPO_PUBLIC_API_URL ??= 'http://localhost:8000';

// lucide é ESM puro (.mjs); nos testes, cada ícone vira um View simples.
jest.mock('lucide-react-native', () => {
  const { View } = jest.requireActual('react-native');
  return new Proxy({}, { get: () => View });
});

// O logger escreve no console; nos testes, silencioso (o teste do logger espiona por conta própria).
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
