import { fireEvent, render, screen } from '@testing-library/react-native';

import type { VagaGestao } from '../api';
import { PassoFotos } from '../PassoFotos';

jest.mock('../hooks', () => ({
  useFotos: () => ({
    enviar: { mutateAsync: jest.fn(), isPending: false },
    remover: { mutate: jest.fn(), error: null },
  }),
}));
jest.mock('@/lib/foto', () => ({ escolherFoto: jest.fn(), erroFotoLocal: () => null }));

const vaga = {
  id: 'v1',
  fotos: [{ id: 'f1', status: 'valida', url: 'https://storage.test/f1', largura: 10, altura: 10 }],
} as unknown as VagaGestao;

describe('PassoFotos', () => {
  it('câmera e galeria só depois de confirmar o aviso', async () => {
    await render(<PassoFotos vaga={vaga} onVoltar={jest.fn()} onContinuar={jest.fn()} />);
    expect(screen.getByText('Fotografe só a vaga vazia')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Câmera' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Galeria' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('checkbox', { name: /Minhas fotos mostram só a vaga vazia/ }));
    expect(screen.getByRole('button', { name: 'Câmera' })).toBeEnabled();
    expect(screen.getByText(/1 de 4 fotos/)).toBeOnTheScreen();
    expect(screen.getByText('Capa')).toBeOnTheScreen();
  });

  it('com 4 fotos, não oferece adicionar', async () => {
    const cheia = {
      ...vaga,
      fotos: ['a', 'b', 'c', 'd'].map((id) => ({ id, status: 'valida', url: `https://storage.test/${id}`, largura: 1, altura: 1 })),
    } as unknown as VagaGestao;
    await render(<PassoFotos vaga={cheia} onVoltar={jest.fn()} onContinuar={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Câmera' })).toBeNull();
    expect(screen.getByText(/4 de 4 fotos/)).toBeOnTheScreen();
  });
});
