/**
 * Configuração pública do app. Toda variável `EXPO_PUBLIC_*` vai dentro do bundle
 * e é pública: aqui só entra a URL da API (spec, seção 5).
 */
export function resolveApiUrl(raw: string | undefined, isDev: boolean): string {
  if (!raw) throw new Error('EXPO_PUBLIC_API_URL não definida.');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL inválida.');
  }
  if (url.protocol !== 'https:' && !(isDev && url.protocol === 'http:')) {
    throw new Error('EXPO_PUBLIC_API_URL precisa ser https fora de dev.');
  }
  if (url.search || url.hash || url.username || url.password) {
    throw new Error('EXPO_PUBLIC_API_URL não pode ter query, fragmento ou credenciais.');
  }
  return url.toString().replace(/\/+$/, '');
}

let cached: string | undefined;

export function apiUrl(): string {
  cached ??= resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, __DEV__);
  return cached;
}
