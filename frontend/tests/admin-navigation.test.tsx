import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { AdminLayout } from '@/components/layout/admin-layout';
import { isAdminBottomNavItemActive, isAdminNavItemActive } from '@/components/layout/nav-config';
import { adminBottomNav } from '@/components/layout/nav-config';

function renderAdminShell(initialPath: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div data-testid="admin-child">Child</div>} />
            <Route path="sellers" element={<div>Sellers child</div>} />
            <Route path="verifications" element={<div>Verifications child</div>} />
            <Route path="medicines" element={<div>Medicines child</div>} />
            <Route path="notifications" element={<div>Notifications child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('Admin navigation', () => {
  it('shows mobile admin bottom nav with Home pointing to admin dashboard', () => {
    renderAdminShell('/admin/sellers');
    const home = screen.getByTestId('nav-admin-bottom-adminHome');
    expect(home).toHaveAttribute('href', '/admin');
    expect(home).toHaveTextContent('Home');
  });

  it('marks Admin Home active only on /admin', () => {
    const homeItem = adminBottomNav[0];
    expect(isAdminBottomNavItemActive('/admin', homeItem)).toBe(true);
    expect(isAdminBottomNavItemActive('/admin/sellers', homeItem)).toBe(false);
    expect(isAdminBottomNavItemActive('/admin/verifications', homeItem)).toBe(false);
  });

  it('marks verifications active on /admin/verifications', () => {
    const verifications = adminBottomNav.find((item) => item.to === '/admin/verifications');
    expect(verifications).toBeTruthy();
    expect(isAdminBottomNavItemActive('/admin/verifications', verifications!)).toBe(true);
  });

  it('does not mark marketplace home as admin dashboard', () => {
    expect(isAdminNavItemActive('/', { to: '/admin' })).toBe(false);
    expect(isAdminNavItemActive('/admin', { to: '/admin' })).toBe(true);
  });

  it('highlights notifications in admin shell', () => {
    renderAdminShell('/admin/notifications');
    const alerts = screen.getByTestId('nav-admin-bottom-notifications');
    expect(alerts).toHaveAttribute('href', '/admin/notifications');
  });

  it('uses a bounded scroll region for admin page content', () => {
    renderAdminShell('/admin');
    const main = document.getElementById('admin-main-content');
    expect(main).not.toBeNull();
    expect(main).toHaveClass('app-scroll-region');
    expect(main).toHaveClass('overflow-y-auto');
  });
});
