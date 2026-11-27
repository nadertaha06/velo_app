import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type TermosVigentes = components['schemas']['TermosVigentesOut'];
export type Documento = components['schemas']['AceiteIn']['documento'];

export const documentoLabel: Record<Documento, string> = {
  termos_uso: 'Termos de uso',
  politica_privacidade: 'Política de privacidade',
};

/** Aceite dos termos e da política, com versão (backend D94). */
export const termosApi = {
  /** Público: versões vigentes para a tela de cadastro. */
  vigentes() {
    return unwrap(api.GET('/termos'));
  },
  aceitar(documento: Documento, versao: string) {
    return unwrap(api.POST('/me/aceites', { body: { documento, versao } }));
  },
};
