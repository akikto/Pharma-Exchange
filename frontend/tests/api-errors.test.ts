import { describe, expect, it } from 'vitest';
import {
  formatValidationErrorMessage,
  getErrorMessage,
  mapValidationDetailMessage,
  MEDICINE_SELECTION_MESSAGE,
} from '@/lib/api-errors';
import { ApiError } from '@/lib/api';

describe('api-errors', () => {
  it('maps medicineId validation to a friendly message', () => {
    expect(
      mapValidationDetailMessage({ path: 'medicineId', message: 'Invalid uuid' }),
    ).toBe(MEDICINE_SELECTION_MESSAGE);
  });

  it('formats multiple validation details', () => {
    expect(
      formatValidationErrorMessage([
        { path: 'medicineId', message: 'Invalid uuid' },
        { path: 'batchNumber', message: 'String must contain at least 1 character(s)' },
      ]),
    ).toBe(`${MEDICINE_SELECTION_MESSAGE} batchNumber: String must contain at least 1 character(s)`);
  });

  it('surfaces validation details from ApiError', () => {
    const error = new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', [
      { path: 'medicineId', message: 'Medicine selection is required.' },
    ]);
    expect(getErrorMessage(error)).toBe(MEDICINE_SELECTION_MESSAGE);
  });

  it('falls back to ApiError message when details are missing', () => {
    const error = new ApiError(400, 'Validation failed', 'VALIDATION_ERROR');
    expect(getErrorMessage(error)).toBe('Validation failed');
  });
});
