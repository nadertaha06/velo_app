import { NETWORK_MESSAGE } from '@/api/errors';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <Screen title="Sem conexão">
      <AppText tone="muted">{NETWORK_MESSAGE}</AppText>
      <Button label="Tentar de novo" onPress={onRetry} />
    </Screen>
  );
}
