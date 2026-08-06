import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useChatSocket, appendUniqueMessage } from '@/hooks/use-chat';
import type { Message } from '@/types';

const emitHandlers: Record<string, Array<(payload: unknown) => void>> = {};
const mockSocket = {
  connected: true,
  connect: vi.fn(),
  emit: vi.fn((event: string, _id: string, ack?: (response: { ok: boolean }) => void) => {
    if (event === 'join:conversation') ack?.({ ok: true });
  }),
  on: vi.fn((event: string, handler: (payload: unknown) => void) => {
    emitHandlers[event] = [...(emitHandlers[event] ?? []), handler];
  }),
  off: vi.fn(),
  once: vi.fn((event: string, handler: () => void) => {
    if (event === 'connect') handler();
  }),
};

vi.mock('@/lib/socket', () => ({
  connectSocket: () => mockSocket,
  getSocket: () => mockSocket,
}));

const sampleMessage = (id: string): Message => ({
  id,
  conversationId: 'conv-1',
  content: `Hello ${id}`,
  type: 'TEXT',
  createdAt: new Date().toISOString(),
  isRead: false,
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useChatSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(emitHandlers)) delete emitHandlers[key];
  });

  it('delivers message:new events to the handler', () => {
    const onMessage = vi.fn();
    renderHook(() => useChatSocket('conv-1', onMessage), { wrapper });

    const message = sampleMessage('msg-1');
    act(() => {
      for (const handler of emitHandlers['message:new'] ?? []) handler(message);
    });

    expect(onMessage).toHaveBeenCalledWith(message);
    expect(mockSocket.emit).toHaveBeenCalledWith('join:conversation', 'conv-1', expect.any(Function));
  });

  it('dedupes messages with appendUniqueMessage', () => {
    const first = [sampleMessage('a')];
    const second = appendUniqueMessage(first, sampleMessage('a'));
    expect(second).toHaveLength(1);
    expect(appendUniqueMessage(first, sampleMessage('b'))).toHaveLength(2);
  });
});
