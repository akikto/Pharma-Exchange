import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip } from '@/components/ui/status-chip';

describe('StatusChip', () => {
  it('renders label text', () => {
    render(<StatusChip label="Verified" variant="success" />);
    expect(screen.getByText('Verified')).toBeDefined();
  });
});
