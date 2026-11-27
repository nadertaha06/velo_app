import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { enviarParaUrlAssinada, prepararJpeg, redimensionamento } from '../foto';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async () => ({ uri: 'file:///convertida.jpg', width: 1, height: 1 })),
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('expo-image-picker', () => ({}));

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('foto', () => {
  it('lado maior até 2048 px, mantendo a proporção', () => {
    expect(redimensionamento(4032, 3024)).toEqual({ width: 2048 });
    expect(redimensionamento(3024, 4032)).toEqual({ height: 2048 });
    expect(redimensionamento(1600, 1200)).toBeNull();
  });

  it('toda foto vira JPEG com qualidade 0,8 (inclusive HEIC)', async () => {
    const blob = { size: 1234 } as Blob;
    fetchMock.mockResolvedValueOnce({ blob: async () => blob });
    const r = await prepararJpeg({ uri: 'file:///IMG_0001.HEIC', width: 4032, height: 3024 });
    expect(manipulateAsync).toHaveBeenCalledWith('file:///IMG_0001.HEIC', [{ resize: { width: 2048 } }], {
      compress: 0.8,
      format: SaveFormat.JPEG,
    });
    expect(r).toEqual({ uri: 'file:///convertida.jpg', blob, size: 1234, contentType: 'image/jpeg' });
  });

  it('envia com o método e os cabeçalhos que a API pediu', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });
    const blob = { size: 10 } as Blob;
    await enviarParaUrlAssinada(
      { upload_url: 'https://storage.test/u', upload_method: 'PUT', upload_headers: { 'Content-Type': 'image/jpeg', 'Content-Length': 10 } },
      { uri: 'x', blob, size: 10, contentType: 'image/jpeg' },
    );
    expect(fetchMock).toHaveBeenCalledWith('https://storage.test/u', {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '10' },
      body: blob,
    });
  });

  it('falha no envio vira erro', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    await expect(
      enviarParaUrlAssinada(
        { upload_url: 'https://storage.test/u', upload_method: 'PUT', upload_headers: {} },
        { uri: 'x', blob: {} as Blob, size: 1, contentType: 'image/jpeg' },
      ),
    ).rejects.toThrow('upload');
  });
});
