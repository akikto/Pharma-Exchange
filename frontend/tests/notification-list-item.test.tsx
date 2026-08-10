import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { NotificationListItem } from '@/components/notifications/notification-list-item';
import type { Notification } from '@/types';

const baseNotification: Notification = {
  id: 'n1',
  type: 'ORDER',
  title: 'Order confirmed',
  body: 'Your order ORD-123 has been confirmed.',
  isRead: false,
  createdAt: '2026-08-10T12:00:00.000Z',
};

function renderItem(notification: Notification, props?: { isClickable?: boolean }) {
  return render(
    <I18nextProvider i18n={i18n}>
      <NotificationListItem
        notification={notification}
        isClickable={props?.isClickable}
        onClick={() => undefined}
      />
    </I18nextProvider>,
  );
}

describe('NotificationListItem', () => {
  it('renders unread styling with left indicator and dot', () => {
    renderItem(baseNotification);

    const item = screen.getByTestId('notification-list-item');
    expect(item).toHaveAttribute('data-read', 'false');
    expect(item.className).toContain('bg-primary-subtle');
    expect(item.className).toContain('border-l-primary');
    expect(screen.getByTestId('notification-unread-dot')).toBeInTheDocument();

    const title = screen.getByText('Order confirmed');
    expect(title.className).toContain('font-semibold');

    const body = screen.getByText('Your order ORD-123 has been confirmed.');
    expect(body.className).toContain('text-text-primary');
  });

  it('renders read styling without indicator or dot', () => {
    renderItem({ ...baseNotification, isRead: true });

    const item = screen.getByTestId('notification-list-item');
    expect(item).toHaveAttribute('data-read', 'true');
    expect(item.className).not.toContain('border-l-primary');
    expect(screen.queryByTestId('notification-unread-dot')).not.toBeInTheDocument();

    const title = screen.getByText('Order confirmed');
    expect(title.className).toContain('font-medium');
    expect(title.className).not.toContain('font-semibold');

    const body = screen.getByText('Your order ORD-123 has been confirmed.');
    expect(body.className).toContain('text-text-secondary');
  });
});
