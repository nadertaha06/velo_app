import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type VagaAnuncio = components['schemas']['VagaAnuncioOut'];
export type Cotacao = components['schemas']['CotacaoOut'];
export type CotacaoIn = components['schemas']['CotacaoIn'];

export const vagasApi = {
  list(condominio_id: string) {
    return unwrap(api.GET('/condominios/{condominio_id}/vagas', { params: { path: { condominio_id } } }));
  },
  get(condominio_id: string, vaga_id: string) {
    return unwrap(
      api.GET('/condominios/{condominio_id}/vagas/{vaga_id}', { params: { path: { condominio_id, vaga_id } } }),
    );
  },
  cotacao(condominio_id: string, vaga_id: string, body: CotacaoIn) {
    return unwrap(
      api.POST('/condominios/{condominio_id}/vagas/{vaga_id}/cotacao', {
        params: { path: { condominio_id, vaga_id } },
        body,
      }),
    );
  },
};
