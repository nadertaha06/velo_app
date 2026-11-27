import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type Membro = components['schemas']['MembroOut'];
export type Convite = components['schemas']['ConviteOut'];
export type VagaGestao = components['schemas']['VagaGestaoOut'];

type Path = { condominio_id: string; unidade_id: string };
const U = '/condominios/{condominio_id}/unidades/{unidade_id}' as const;

/** Gestão da unidade: só o responsável (backend devolve 404 para os outros). */
export const unidadeApi = {
  membros(path: Path) {
    return unwrap(api.GET(`${U}/membros`, { params: { path } }));
  },
  /** Efeito imediato; reservas futuras do membro são canceladas com reembolso integral (backend). */
  removerMembro(path: Path, vinculo_id: string) {
    return unwrap(api.DELETE(`${U}/membros/{vinculo_id}`, { params: { path: { ...path, vinculo_id } } }));
  },
  convites(path: Path) {
    return unwrap(api.GET(`${U}/convites`, { params: { path } }));
  },
  /** Com e-mail, o backend envia o convite; sem, só devolve o link para compartilhar. */
  convidar(path: Path, email: string | null) {
    return unwrap(api.POST(`${U}/convites`, { params: { path }, body: { email } }));
  },
  /** Gera um link novo; o anterior deixa de valer (backend). */
  reenviar(path: Path, convite_id: string) {
    return unwrap(
      api.POST(`${U}/convites/{convite_id}/reenviar`, { params: { path: { ...path, convite_id } }, body: {} }),
    );
  },
  revogar(path: Path, convite_id: string) {
    return unwrap(api.DELETE(`${U}/convites/{convite_id}`, { params: { path: { ...path, convite_id } } }));
  },
  vagas(path: Path) {
    return unwrap(api.GET(`${U}/vagas`, { params: { path } }));
  },
  subconta(path: Path) {
    return unwrap(api.GET(`${U}/subconta`, { params: { path } }));
  },
};
