import { useFiltro } from '@/features/explorar/FiltroProvider';

import type { Veiculo } from './api';
import { useVeiculos } from './hooks';

/**
 * Veículo do filtro. Com um só, usa direto; com vários, só o que a pessoa
 * escolheu (nunca "o primeiro da lista", como no vínculo).
 */
export function useVeiculoEscolhido(): { veiculo: Veiculo | null; veiculos: Veiculo[]; isLoading: boolean } {
  const { veiculoId } = useFiltro();
  const q = useVeiculos();
  const veiculos = q.data ?? [];
  const veiculo =
    veiculos.find((v) => v.id === veiculoId) ?? (veiculos.length === 1 ? veiculos[0]! : null);
  return { veiculo, veiculos, isLoading: q.isLoading };
}
