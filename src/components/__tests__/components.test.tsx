import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';
import { Chip } from '../Chip';
import { DevLinkField } from '../DevLinkField';
import { TextField } from '../TextField';

describe('Button', () => {
  it('expõe papel, rótulo e estado desabilitado', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" disabled onPress={onPress} />);
    const btn = screen.getByRole('button', { name: 'Entrar' });
    expect(btn).toBeDisabled();
    await fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('carregando fica ocupado e desabilitado', async () => {
    await render(<Button label="Entrar" loading />);
    const btn = screen.getByRole('button', { name: 'Entrar' });
    expect(btn).toBeBusy();
    expect(btn).toBeDisabled();
  });
});

describe('Chip', () => {
  it('expõe o estado selecionado', async () => {
    await render(<Chip label="Dia" selected onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Dia' })).toBeSelected();
  });
});

describe('TextField', () => {
  it('botão de senha tem rótulo e alterna', async () => {
    await render(<TextField label="Senha" password value="" onChangeText={() => {}} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeOnTheScreen();
  });

  it('mostra o erro', async () => {
    await render(<TextField label="E-mail" error="E-mail inválido." value="" onChangeText={() => {}} />);
    expect(screen.getByText('E-mail inválido.')).toBeOnTheScreen();
  });
});

describe('DevLinkField', () => {
  const T = 'k'.repeat(43);

  it('em dev extrai o token do link colado', async () => {
    const onToken = jest.fn();
    await render(<DevLinkField kind="convite" onToken={onToken} />);
    await fireEvent.changeText(screen.getByLabelText(/Colar o link/), `https://velo.test/convite#token=${T}`);
    expect(onToken).toHaveBeenLastCalledWith(T);
  });

  it('link de outro tipo não gera token e mostra erro', async () => {
    const onToken = jest.fn();
    await render(<DevLinkField kind="convite" onToken={onToken} />);
    await fireEvent.changeText(screen.getByLabelText(/Colar o link/), `https://velo.test/redefinir-senha?token=${T}`);
    expect(onToken).toHaveBeenLastCalledWith(null);
    expect(screen.getByText('Link inválido para esta tela.')).toBeOnTheScreen();
  });
});
