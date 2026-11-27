import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type VagaIn = components['schemas']['VagaIn'];
export type VagaPatch = components['schemas']['VagaPatch'];
export type VagaGestao = components['schemas']['VagaGestaoOut'];
export type Foto = components['schemas']['FotoOut'];

type Path = { condominio_id: string; unidade_id: string };
const VAGAS = '/condominios/{condominio_id}/unidades/{unidade_id}/vagas' as const;
const VAGA = `${VAGAS}/{vaga_id}` as const;

/** Anúncio e edição da vaga: só o responsável da unidade (backend). */
export const anunciarApi = {
  criar(path: Path, body: VagaIn) {
    return unwrap(api.POST(VAGAS, { params: { path }, body }));
  },
  get(path: Path, vaga_id: string) {
    return unwrap(api.GET(VAGA, { params: { path: { ...path, vaga_id } } }));
  },
  editar(path: Path, vaga_id: string, body: VagaPatch) {
    return unwrap(api.PATCH(VAGA, { params: { path: { ...path, vaga_id } }, body }));
  },
  addDisponibilidade(path: Path, vaga_id: string, periodo: { inicio: string; fim: string }) {
    return unwrap(api.POST(`${VAGA}/disponibilidades`, { params: { path: { ...path, vaga_id } }, body: periodo }));
  },
  removerDisponibilidade(path: Path, vaga_id: string, disponibilidade_id: string) {
    return unwrap(
      api.DELETE(`${VAGA}/disponibilidades/{disponibilidade_id}`, {
        params: { path: { ...path, vaga_id, disponibilidade_id } },
      }),
    );
  },
  /** A API exige `aviso_confirmado: true` (o app mostrou o aviso e a pessoa confirmou). */
  pedirUpload(path: Path, vaga_id: string, size_bytes: number) {
    return unwrap(
      api.POST(`${VAGA}/fotos`, {
        params: { path: { ...path, vaga_id } },
        body: { content_type: 'image/jpeg', size_bytes, aviso_confirmado: true },
      }),
    );
  },
  concluirFoto(path: Path, vaga_id: string, foto_id: string) {
    return unwrap(api.POST(`${VAGA}/fotos/{foto_id}/concluir`, { params: { path: { ...path, vaga_id, foto_id } } }));
  },
  removerFoto(path: Path, vaga_id: string, foto_id: string) {
    return unwrap(api.DELETE(`${VAGA}/fotos/{foto_id}`, { params: { path: { ...path, vaga_id, foto_id } } }));
  },
};

export const MAX_FOTOS = 4;
