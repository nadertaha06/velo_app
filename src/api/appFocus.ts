import { focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Liga o "foco" do TanStack Query ao estado do app. Em segundo plano, os
 * `refetchInterval` param; ao voltar, as consultas marcadas para isso buscam de novo.
 */
export function setupAppFocus(): () => void {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => handleFocus(s === 'active'));
    return () => sub.remove();
  });
  return () => focusManager.setEventListener(() => () => {});
}
