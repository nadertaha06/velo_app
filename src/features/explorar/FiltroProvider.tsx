import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Modalidade } from '@/features/pedidos/labels';

/**
 * Escolhas de quem aluga: modalidade, quantidade, início e veículo. Valem para a
 * lista, o detalhe e o pedido. Só em memória (não é preciso guardar).
 */
export type Filtro = {
  modalidade: Modalidade;
  quantidade: number;
  /** ISO 8601 em UTC. */
  inicio: string;
  veiculoId: string | null;
};

type Ctx = Filtro & { set: (patch: Partial<Filtro>) => void };

const FiltroContext = createContext<Ctx | null>(null);

/** Próxima hora cheia mais uma: um início no futuro para começar. */
export function inicioPadrao(now: number): string {
  const hour = 3_600_000;
  return new Date(Math.ceil(now / hour) * hour + hour).toISOString();
}

export function FiltroProvider({ children }: { children: ReactNode }) {
  const [filtro, setFiltro] = useState<Filtro>(() => ({
    modalidade: 'dia',
    quantidade: 1,
    inicio: inicioPadrao(Date.now()),
    veiculoId: null,
  }));
  const value = useMemo<Ctx>(
    () => ({ ...filtro, set: (patch) => setFiltro((f) => ({ ...f, ...patch })) }),
    [filtro],
  );
  return <FiltroContext.Provider value={value}>{children}</FiltroContext.Provider>;
}

export function useFiltro(): Ctx {
  const ctx = useContext(FiltroContext);
  if (!ctx) throw new Error('useFiltro fora do FiltroProvider');
  return ctx;
}
