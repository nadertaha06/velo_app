import { resolveVinculo, vinculoKey, type Vinculo } from '../resolve';

const v = (vinculo_id: string, condominio_id: string, unidade_id: string | null, papel: string): Vinculo => ({
  vinculo_id,
  condominio_id,
  condominio_nome: `Condomínio ${condominio_id}`,
  papel,
  unidade_id,
  bloco: unidade_id ? 'A' : null,
  numero: unidade_id ? '101' : null,
});

const a = v('v1', 'c1', 'u1', 'responsavel');
const b = v('v2', 'c2', 'u2', 'membro');

describe('resolveVinculo', () => {
  it('sem vínculo', () => {
    expect(resolveVinculo([], null)).toEqual({ kind: 'none' });
  });

  it('com um só, entra direto (ignora o guardado)', () => {
    expect(resolveVinculo([a], 'outra-chave')).toEqual({ kind: 'chosen', vinculo: a });
  });

  it('com vários e nada guardado, pergunta (nunca pega o primeiro)', () => {
    expect(resolveVinculo([a, b], null)).toEqual({ kind: 'choose', options: [a, b] });
  });

  it('com vários, usa o guardado se ainda existir', () => {
    expect(resolveVinculo([a, b], vinculoKey(b))).toEqual({ kind: 'chosen', vinculo: b });
  });

  it('guardado que não existe mais faz perguntar de novo', () => {
    expect(resolveVinculo([a, b], vinculoKey(v('v9', 'c9', 'u9', 'membro')))).toMatchObject({ kind: 'choose' });
  });

  it('a chave é o vinculo_id do backend', () => {
    expect(vinculoKey(a)).toBe('v1');
  });

  it('chave no formato antigo (condomínio:unidade:papel) faz perguntar de novo', () => {
    expect(resolveVinculo([a, b], 'c2:u2:membro')).toMatchObject({ kind: 'choose' });
  });
});
