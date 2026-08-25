import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MedicineImageUpload } from '@/components/medicine/medicine-image-upload';

describe('MedicineImageUpload preview-only mode', () => {
  it('does not render file input or upload controls when allowUpload is false', () => {
    render(
      <MedicineImageUpload
        label="Listing image"
        value="https://example.com/catalog.webp"
        allowUpload={false}
        onChange={() => undefined}
        testId="listing-image-upload"
      />,
    );

    expect(screen.getByTestId('listing-image-upload')).toBeInTheDocument();
    expect(screen.queryByTestId('listing-image-upload-input')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upload image/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove image/i })).not.toBeInTheDocument();
    expect(screen.getByText(/managed by admins/i)).toBeInTheDocument();
  });
});
