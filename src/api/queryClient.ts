import { QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

export const queryClient = new QueryClient({
  // Termos mudaram no meio do uso (backend D94): recarrega o /me, e o gate pede o aceite.
  queryCache: new QueryCache({
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'terms_acceptance_required') {
        void queryClient.invalidateQueries({ queryKey: ['me'] });
      }
    },
  }),
  defaultOptions: {
    queries: {
      // 4xx é resposta do backend, não falha passageira: não repete.
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      staleTime: 30_000,
    },
    mutations: { retry: false },
  },
});
