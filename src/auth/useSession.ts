import { useSyncExternalStore } from 'react';

import { session } from '@/api/client';
import type { SessionStatus } from './session';

export function useSessionStatus(): SessionStatus {
  return useSyncExternalStore(session.subscribe, session.getStatus);
}
