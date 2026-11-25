import type { Modalidade } from '@/features/pedidos/labels';

import type { VagaAnuncio } from './api';

/**
 * O que a lista mostra. Só usa campos que o backend já devolve: esconde as vagas
 * da minha unidade (`da_minha_unidade`) e as que não têm a modalidade ligada
 * (preço `null`). Porte e disponibilidade NÃO são filtrados aqui: essa regra é
 * do backend, e o `GET /vagas` ainda não aceita filtro (docs/decisoes.md, D9).
 */
export function visibleVagas(vagas: VagaAnuncio[], modalidade: Modalidade): VagaAnuncio[] {
  return vagas.filter((v) => !v.da_minha_unidade && v.precos[modalidade] != null);
}
