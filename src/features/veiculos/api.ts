import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema';

export type Veiculo = components['schemas']['VeiculoOut'];
export type VeiculoIn = components['schemas']['VeiculoIn'];

export const veiculosApi = {
  list: () => unwrap(api.GET('/me/veiculos')),
  criar: (body: VeiculoIn) => unwrap(api.POST('/me/veiculos', { body })),
};
