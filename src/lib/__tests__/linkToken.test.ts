import { extractLinkToken } from '../linkToken';

const T = 'A'.repeat(20) + '-_' + 'b'.repeat(21); // fictício, formato url-safe

describe('extractLinkToken', () => {
  it('aceita ?token= e #token=', () => {
    expect(extractLinkToken(`https://velo.test/convite?token=${T}`, 'convite')).toBe(T);
    expect(extractLinkToken(`https://velo.test/convite#token=${T}`, 'convite')).toBe(T);
  });

  it('prefere o fragmento quando vêm os dois', () => {
    const other = 'c'.repeat(30);
    expect(extractLinkToken(`https://velo.test/convite?token=${other}#token=${T}`, 'convite')).toBe(T);
  });

  it('aceita espaços em volta e base com caminho', () => {
    expect(extractLinkToken(`  http://192.168.0.2:8000/app/verificar-email?token=${T}\n`, 'verificar-email')).toBe(T);
  });

  it('recusa link de outro tipo', () => {
    expect(extractLinkToken(`https://velo.test/convite?token=${T}`, 'redefinir-senha')).toBeNull();
  });

  it.each([
    ['sem token', 'https://velo.test/convite'],
    ['token curto', 'https://velo.test/convite?token=abc'],
    ['caractere inválido', `https://velo.test/convite?token=${T}%2F`],
    ['esquema próprio', `velo://convite?token=${T}`],
    ['javascript', `javascript:alert(1)//convite?token=${T}`],
    ['texto solto', T],
  ])('recusa %s', (_n, input) => {
    expect(extractLinkToken(input, 'convite')).toBeNull();
  });
});
