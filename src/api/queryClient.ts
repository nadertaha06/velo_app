import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx é resposta do backend, não falha passageira: não repete.
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      staleTime: 30_000,
    },
    mutations: { retry: false },
  },
});
