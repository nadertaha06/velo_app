import { render, screen } from '@testing-library/react-native';

import { VeloLogo } from '../brand/VeloLogo';

describe('VeloLogo', () => {
  it('é uma imagem com o nome da marca para leitor de tela', async () => {
    await render(<VeloLogo />);
    expect(screen.getByRole('image', { name: 'Velo' })).toBeOnTheScreen();
  });
});
