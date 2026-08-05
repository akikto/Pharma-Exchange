import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { axe } from 'vitest-axe';
import i18n from '@/i18n';
import { AppLayout } from '@/components/layout/app-layout';
import { RequestsHubPage } from '@/features/buyer/requests-hub-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithProviders(ui: React.ReactElement, path = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('AppLayout accessibility', () => {
  it('exposes skip link and main landmark', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>Home</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByRole('link', { name: /skip to main content|মূল বিষয়বস্তুতে যান/i })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('has no serious axe violations on shell', async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<h1>Home</h1>} />
        </Route>
      </Routes>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('RequestsHubPage accessibility', () => {
  it('uses tablist semantics with labelled panels', () => {
    renderWithProviders(<RequestsHubPage />, '/cart');

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: /cart|কার্ট/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /cart|কার্ট/i })).toBeInTheDocument();
  });

  it('has no serious axe violations', async () => {
    const { container } = renderWithProviders(<RequestsHubPage />, '/cart');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
