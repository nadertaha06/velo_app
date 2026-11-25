import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/api/errors';

/** Põe nos campos os erros de validação devolvidos pelo backend (`details`). */
export function applyFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  map: Partial<Record<string, Path<T>>>,
): boolean {
  if (!(err instanceof ApiError)) return false;
  let applied = false;
  for (const [field, message] of Object.entries(err.fields)) {
    const target = map[field];
    if (target) {
      setError(target, { message });
      applied = true;
    }
  }
  return applied;
}
