import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { ChatHeader } from '@/components/chat/chat-header';
import type { ChatConversationDetail } from '@/hooks/use-chat-api';
import { ApiError } from '@/lib/api';

const post = vi.fn();

const authState = vi.hoisted(() => ({
  user: {
    id: 'seller-user-1',
    firstName: 'Karim',
    lastName: 'Ahmed',
    role: 'USER' as const,
    pharmacy: {
      id: 'pharmacy-1',
      name: 'City Pharmacy',
      verificationStatus: 'APPROVED' as const,
      rating: 4.6,
    },
  },
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: (...args: unknown[]) => post(...args),
      patch: vi.fn(),
      delete: vi.fn(),
      getText: vi.fn(),
      upload: vi.fn(),
    },
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const requestId = '550e8400-e29b-41d4-a716-446655440000';

const conversation: ChatConversationDetail = {
  id: 'conv-1',
  updatedAt: '2026-08-07T00:00:00.000Z',
  members: [],
  messages: [],
  counterparty: { id: 'buyer-1', firstName: 'Rahim', lastName: 'Hossain' },
  buyRequest: {
    id: requestId,
    requestNumber: 'BR-2026-000001',
    status: 'PENDING',
    totalAmount: '1280',
    seller: { userId: 'seller-user-1' },
  },
};

function buttonShowsLoading(button: HTMLElement) {
  return button.querySelector('.animate-spin') !== null;
}

function renderChatHeader() {
  void i18n.changeLanguage('en');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onRefreshMessages = vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <ChatHeader conversation={conversation} onRefreshMessages={onRefreshMessages} />
      </QueryClientProvider>
    </I18nextProvider>,
  );
  return { onRefreshMessages };
}

describe('ChatHeader buy request respond loading state', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('shows loading only on Accept when Accept is tapped', async () => {
    let resolvePost: (value: unknown) => void = () => undefined;
    post.mockImplementation(() => new Promise((resolve) => {
      resolvePost = resolve;
    }));

    renderChatHeader();
    const acceptButton = screen.getByTestId('chat-buy-request-accept-button');
    const rejectButton = screen.getByTestId('chat-buy-request-reject-button');

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(buttonShowsLoading(acceptButton)).toBe(true);
      expect(buttonShowsLoading(rejectButton)).toBe(false);
    });

    resolvePost({ buyRequest: { status: 'ACCEPTED' } });

    await waitFor(() => {
      expect(buttonShowsLoading(acceptButton)).toBe(false);
      expect(buttonShowsLoading(rejectButton)).toBe(false);
    });
  });

  it('shows loading only on Reject when Reject is tapped', async () => {
    let resolvePost: (value: unknown) => void = () => undefined;
    post.mockImplementation(() => new Promise((resolve) => {
      resolvePost = resolve;
    }));

    renderChatHeader();
    const acceptButton = screen.getByTestId('chat-buy-request-accept-button');
    const rejectButton = screen.getByTestId('chat-buy-request-reject-button');

    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(buttonShowsLoading(rejectButton)).toBe(true);
      expect(buttonShowsLoading(acceptButton)).toBe(false);
    });

    resolvePost({ buyRequest: { status: 'REJECTED' } });

    await waitFor(() => {
      expect(buttonShowsLoading(rejectButton)).toBe(false);
      expect(buttonShowsLoading(acceptButton)).toBe(false);
    });
  });

  it('clears loading after backend error', async () => {
    post.mockRejectedValue(new ApiError(500, 'Internal server error', 'INTERNAL_ERROR'));

    renderChatHeader();
    const acceptButton = screen.getByTestId('chat-buy-request-accept-button');
    const rejectButton = screen.getByTestId('chat-buy-request-reject-button');

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(buttonShowsLoading(acceptButton)).toBe(false);
      expect(buttonShowsLoading(rejectButton)).toBe(false);
    });
  });

  it('prevents duplicate submissions while a response is pending', async () => {
    let resolvePost: (value: unknown) => void = () => undefined;
    post.mockImplementation(() => new Promise((resolve) => {
      resolvePost = resolve;
    }));

    renderChatHeader();
    const acceptButton = screen.getByTestId('chat-buy-request-accept-button');
    const rejectButton = screen.getByTestId('chat-buy-request-reject-button');

    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(buttonShowsLoading(acceptButton)).toBe(true);
      expect(acceptButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });

    fireEvent.click(acceptButton);
    fireEvent.click(rejectButton);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(`/buy-requests/${requestId}/respond`, { action: 'accept' });

    resolvePost({ buyRequest: { status: 'ACCEPTED' } });

    await waitFor(() => {
      expect(buttonShowsLoading(acceptButton)).toBe(false);
      expect(acceptButton).not.toBeDisabled();
      expect(rejectButton).not.toBeDisabled();
    });
  });
});
