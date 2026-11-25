import { router } from 'expo-router';

import { ChooseVinculoScreen } from '@/features/vinculo/ChooseVinculoScreen';

export default function EscolherVinculo() {
  return <ChooseVinculoScreen onChosen={() => router.back()} />;
}
