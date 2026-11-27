import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Lado maior de no máximo 2048 px, JPEG qualidade 0,8 (spec do app, seção 6). */
export const LADO_MAXIMO = 2048;
export const QUALIDADE = 0.8;

export type FotoPronta = { uri: string; blob: Blob; size: number; contentType: 'image/jpeg' };

/** Redimensiona só se passar do lado máximo, mantendo a proporção. */
export function redimensionamento(largura: number, altura: number): { width: number } | { height: number } | null {
  if (Math.max(largura, altura) <= LADO_MAXIMO) return null;
  return largura >= altura ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO };
}

/**
 * Converte **toda** foto para JPEG antes de enviar (o backend não aceita HEIC).
 * O reencode também descarta o EXIF, inclusive o GPS. O backend tira de novo.
 */
export async function prepararJpeg(asset: { uri: string; width: number; height: number }): Promise<FotoPronta> {
  const resize = redimensionamento(asset.width, asset.height);
  const r = await manipulateAsync(asset.uri, resize ? [{ resize }] : [], {
    compress: QUALIDADE,
    format: SaveFormat.JPEG,
  });
  const blob = await (await fetch(r.uri)).blob();
  return { uri: r.uri, blob, size: blob.size, contentType: 'image/jpeg' };
}

export type Origem = 'camera' | 'galeria';

/** Abre câmera ou galeria e devolve a foto já em JPEG, ou `null` se a pessoa desistiu. */
export async function escolherFoto(origem: Origem): Promise<FotoPronta | null> {
  const perm =
    origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('permissao');
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  const res =
    origem === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  const asset = res.canceled ? undefined : res.assets[0];
  if (!asset) return null;
  return prepararJpeg(asset);
}

export type UploadAlvo = { upload_url: string; upload_method: string; upload_headers: Record<string, unknown> };

/**
 * Envia direto para a URL assinada, com o método e os cabeçalhos que a API pediu
 * (content-type e tamanho exatos). A URL tem token: não vai para log.
 */
export async function enviarParaUrlAssinada(alvo: UploadAlvo, foto: FotoPronta): Promise<void> {
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(alvo.upload_headers)) headers[k] = String(v);
  const res = await fetch(alvo.upload_url, { method: alvo.upload_method, headers, body: foto.blob });
  if (!res.ok) throw new Error('upload');
}

export const MENSAGEM_PERMISSAO = 'Sem permissão para usar a câmera ou as fotos. Libere nos Ajustes do iPhone.';
export const MENSAGEM_UPLOAD = 'Não deu para enviar a foto. Tente de novo.';

/** Mensagem dos erros locais da foto (permissão e envio); erro da API vem pelo `userMessage`. */
export function erroFotoLocal(err: unknown): string | null {
  if (err instanceof Error && err.message === 'permissao') return MENSAGEM_PERMISSAO;
  if (err instanceof Error && err.message === 'upload') return MENSAGEM_UPLOAD;
  return null;
}
