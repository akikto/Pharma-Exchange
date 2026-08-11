import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageType } from '@prisma/client';

const emit = vi.fn();
const to = vi.fn(() => ({ emit }));

vi.mock('../src/socket', () => ({
  getSocketIo: () => ({ to }),
}));

vi.mock('../src/config/database', () => ({
  default: {
    conversationMember: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/modules/notification', () => ({
  notificationService: {
    create: vi.fn(),
  },
}));

import prisma from '../src/config/database';
import { chatService } from '../src/modules/chat/chat.service';

describe('chatService.sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits message:new to the conversation room after REST send', async () => {
    const message = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'Hello',
      type: MessageType.TEXT,
      sender: { id: 'user-1', firstName: 'A', lastName: 'B' },
    };

    vi.mocked(prisma.conversationMember.findUnique).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        message: { create: vi.fn().mockResolvedValue(message) },
        conversation: { update: vi.fn() },
        conversationMember: { findMany: vi.fn().mockResolvedValue([]) },
      };
      return fn(tx as never);
    });

    const result = await chatService.sendMessage('user-1', 'conv-1', 'Hello');

    expect(result).toEqual(message);
    expect(to).toHaveBeenCalledWith('conversation:conv-1');
    expect(emit).toHaveBeenCalledWith('message:new', message);
  });
});
