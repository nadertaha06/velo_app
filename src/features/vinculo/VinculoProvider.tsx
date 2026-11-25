import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi } from '@/features/auth/api';

import { choiceStore } from './choiceStore';
import { resolveVinculo, vinculoKey, type Resolution, type Vinculo } from './resolve';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown; retry: () => void }
  | (Resolution & { all: Vinculo[] });

type Ctx = { state: State; choose: (v: Vinculo) => Promise<void>; forget: () => Promise<void> };

const VinculoContext = createContext<Ctx | null>(null);

export const meQueryKey = ['me'] as const;

export function VinculoProvider({ children }: { children: ReactNode }) {
  const me = useQuery({ queryKey: meQueryKey, queryFn: authApi.me });
  const [stored, setStored] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    choiceStore.get().then(
      (k) => alive && setStored(k),
      () => alive && setStored(null),
    );
    return () => {
      alive = false;
    };
  }, []);

  const choose = useCallback(async (v: Vinculo) => {
    const key = vinculoKey(v);
    await choiceStore.set(key);
    setStored(key);
  }, []);

  /** Volta a perguntar (seletor do Perfil). */
  const forget = useCallback(async () => {
    await choiceStore.clear();
    setStored(null);
  }, []);

  const state: State = useMemo(() => {
    if (me.isError) return { kind: 'error', error: me.error, retry: () => void me.refetch() };
    if (!me.data || stored === undefined) return { kind: 'loading' };
    return { ...resolveVinculo(me.data.vinculos, stored), all: me.data.vinculos };
  }, [me, stored]);

  const value = useMemo(() => ({ state, choose, forget }), [state, choose, forget]);
  return <VinculoContext.Provider value={value}>{children}</VinculoContext.Provider>;
}

export function useVinculo(): Ctx {
  const ctx = useContext(VinculoContext);
  if (!ctx) throw new Error('useVinculo fora do VinculoProvider');
  return ctx;
}
