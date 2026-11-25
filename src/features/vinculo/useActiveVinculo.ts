import { useVinculo } from './VinculoProvider';
import type { Vinculo } from './resolve';

/** Vínculo ativo. Só use em telas atrás do `VinculoGate` (o gate garante a escolha). */
export function useActiveVinculo(): Vinculo {
  const { state } = useVinculo();
  if (state.kind !== 'chosen') throw new Error('useActiveVinculo fora do VinculoGate');
  return state.vinculo;
}
