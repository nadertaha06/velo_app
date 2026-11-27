import { formatCents } from '@/lib/format';
import { vagaSituacao } from '@/features/unidade/labels';

import { reembolsoTexto } from '../labels';

describe('reembolso pelo status do estorno (backend D89/D90)', () => {
  const t = (c: number | null, s: 'em_processamento' | 'em_analise' | 'nao_aprovado' | 'feito' | null) =>
    reembolsoTexto(c, s, 'Você', formatCents);

  it('só "feito" diz que voltou', () => {
    expect(t(7125, 'feito')).toMatch(/Reembolso de R\$\s71,25 feito/);
    expect(t(7125, 'em_processamento')).toMatch(/em processamento/);
    expect(t(7125, 'em_analise')).toMatch(/em análise/);
    expect(t(7125, 'nao_aprovado')).toMatch(/não foi aprovado/);
    for (const s of ['em_processamento', 'em_analise', 'nao_aprovado', null] as const) expect(t(7125, s)).not.toMatch(/feito/);
  });

  it('sem valor', () => {
    expect(t(null, null)).toBeNull();
    expect(t(0, null)).toBe('Não há valor a devolver.');
  });
});

describe('situação da vaga', () => {
  it('suspensa, pausada, no ar e fora do ar', () => {
    expect(vagaSituacao({ ativa: true, no_ar: false, suspensa_ate: '2099-01-01T03:00:00Z' }).label).toBe('Suspensa');
    expect(vagaSituacao({ ativa: false, no_ar: false, suspensa_ate: null }).label).toBe('Pausada');
    expect(vagaSituacao({ ativa: true, no_ar: true, suspensa_ate: null }).label).toBe('No ar');
    expect(vagaSituacao({ ativa: true, no_ar: false, suspensa_ate: null }).label).toBe('Fora do ar');
  });
});
