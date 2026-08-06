import { describe, expect, it } from 'vitest';
import { appendUniqueMessage } from '@/hooks/use-chat';
import type { Message } from '@/types';

const baseMessage = (id: string): Message => ({
  id,
  conversationId: 'conv-1',
  content: `Message ${id}`,
  type: 'TEXT',
  createdAt: new Date().toISOString(),
  isRead: false,
});

describe('appendUniqueMessage', () => {
  it('appends a new message', () => {
    const prev = [baseMessage('a')];
    const next = appendUniqueMessage(prev, baseMessage('b'));
    expect(next).toHaveLength(2);
  });

  it('does not duplicate messages with the same id', () => {
    const prev = [baseMessage('a')];
    const next = appendUniqueMessage(prev, baseMessage('a'));
    expect(next).toHaveLength(1);
    expect(next).toBe(prev);
  });
});
