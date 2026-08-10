import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { NotificationsPage } from '@/features/notifications/notifications-page';
import type { Notification } from '@/types';

const post = vi.fn();
const patch = vi.fn();
const get = vi.fn();

vi.mock('@/hooks/use-nav-badges', () => ({
  useNavBadges: () => ({
    cart: 0,
    chat: 0,
    requests: 0,
    watchlist: 0,
    notifications: 0,
  }),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    apiClient: {
      get: (...args: unknown[]) => get(...args),
      post: (...args: unknown[]) => post(...args),
      patch: (...args: unknown[]) => patch(...args),
      delete: vi.fn(),
      getText: vi.fn(),
      upload: vi.fn(),
    },
  };
});

const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'ORDER',
    title: 'Unread order update',
    body: 'Your order shipped today.',
    isRead: false,
    createdAt: '2026-08-10T12:00:00.000Z',
  },
  {
    id: 'n2',
    type: 'CHAT',
    title: 'Read chat message',
    body: 'Thanks for your purchase.',
    isRead: true,
    createdAt: '2026-08-09T12:00:00.000Z',
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockImplementation((url: string) => {
      if (url === '/notifications') {
        return Promise.resolve({ data: notifications, unreadCount: 1 });
      }
      return Promise.resolve(null);
    });
    post.mockResolvedValue({});
    patch.mockResolvedValue({});
  });

  it('shows mark all read disabled when there are no unread notifications', async () => {
    get.mockImplementation((url: string) => {
      if (url === '/notifications') {
        return Promise.resolve({
          data: notifications.map((notification) => ({ ...notification, isRead: true })),
          unreadCount: 0,
        });
      }
      return Promise.resolve(null);
    });

    renderPage();

    const markAllButton = await screen.findByRole('button', { name: /mark all read|সব পঠিত/i });
    expect(markAllButton).toBeDisabled();
  });

  it('immediately switches all cards to read state after mark all read', async () => {
    renderPage();

    await screen.findByText('Unread order update');
    expect(screen.getByTestId('notification-unread-dot')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mark all read|সব পঠিত/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('notification-unread-dot')).not.toBeInTheDocument();
    });

    const items = screen.getAllByTestId('notification-list-item');
    expect(items.every((item) => item.getAttribute('data-read') === 'true')).toBe(true);
    expect(post).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('immediately marks a single notification read when opened', async () => {
    renderPage();

    await screen.findByText('Unread order update');
    fireEvent.click(screen.getByText('Unread order update'));

    await waitFor(() => {
      expect(screen.queryByTestId('notification-unread-dot')).not.toBeInTheDocument();
    });
    expect(patch).toHaveBeenCalledWith('/notifications/n1/read');
  });

  it('resyncs notification cache when mark all read API fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    post.mockRejectedValueOnce(new Error('network error'));

    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <NotificationsPage />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    );

    await screen.findByText('Unread order update');
    fireEvent.click(screen.getByRole('button', { name: /mark all read|সব পঠিত/i }));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] });
    });
  });
});
