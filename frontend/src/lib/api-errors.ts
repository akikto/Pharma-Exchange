import { ApiError, type ValidationDetail } from '@/lib/api';

const MEDICINE_ID_PATHS = new Set(['medicineId']);

export const MEDICINE_SELECTION_MESSAGE =
  'Please select a medicine from the search results.';

export function mapValidationDetailMessage(detail: ValidationDetail): string {
  if (MEDICINE_ID_PATHS.has(detail.path)) {
    return MEDICINE_SELECTION_MESSAGE;
  }
  if (detail.path) {
    return `${detail.path}: ${detail.message}`;
  }
  return detail.message;
}

export function formatValidationErrorMessage(
  details: ValidationDetail[] | undefined,
  fallback = 'Validation failed',
): string {
  if (!details?.length) return fallback;
  return details.map(mapValidationDetailMessage).join(' ');
}

export function getErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof ApiError) {
    if (error.code === 'VALIDATION_ERROR' && error.details?.length) {
      return formatValidationErrorMessage(error.details, error.message);
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
