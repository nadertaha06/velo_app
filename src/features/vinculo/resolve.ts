import type { components } from '@/api/schema';

export type Vinculo = components['schemas']['MeuVinculoOut'];

/**
 * Chave do vínculo escolhido. PROVISÓRIO: `GET /me` ainda não devolve o id do
 * vínculo, então a chave combina condomínio, unidade e papel, que o backend já
 * garante únicos para vínculos vivos (índice `uq_vinculos_vivo`). Quando o
 * backend expuser `vinculo_id`, só esta função muda. Ver docs/decisoes.md, D2.
 */
export function vinculoKey(v: Vinculo): string {
  return [v.condominio_id, v.unidade_id ?? '-', v.papel].join(':');
}

export type Resolution =
  | { kind: 'none' }
  | { kind: 'chosen'; vinculo: Vinculo }
  | { kind: 'choose'; options: Vinculo[] };

/** Um só: entra direto. Vários: usa a escolha guardada, se ainda existir; senão pergunta. */
export function resolveVinculo(vinculos: Vinculo[], storedKey: string | null): Resolution {
  if (vinculos.length === 0) return { kind: 'none' };
  if (vinculos.length === 1) return { kind: 'chosen', vinculo: vinculos[0]! };
  const stored = storedKey ? vinculos.find((v) => vinculoKey(v) === storedKey) : undefined;
  return stored ? { kind: 'chosen', vinculo: stored } : { kind: 'choose', options: vinculos };
}

const PAPEL: Record<string, string> = {
  responsavel: 'Responsável',
  membro: 'Membro',
  sindico: 'Síndico',
  portaria: 'Portaria',
  admin_plataforma: 'Administração',
};

export function vinculoLabel(v: Vinculo): { title: string; detail: string } {
  const unidade = v.bloco || v.numero ? [v.bloco && `Bloco ${v.bloco}`, v.numero].filter(Boolean).join(' · ') : null;
  return {
    title: v.condominio_nome,
    detail: [unidade, PAPEL[v.papel] ?? v.papel].filter(Boolean).join(' · '),
  };
}
