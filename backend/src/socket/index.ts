import { MessageType } from '@prisma/client';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { chatService } from '../modules/chat/chat.service';
import { logger } from '../shared/utils/logger';
import prisma from '../config/database';

async function verifyConversationMember(userId: string, conversationId: string): Promise<boolean> {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!member;
}

interface SocketUser {
  userId: string;
  role: string;
}

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as SocketUser;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    logger.info(`Socket connected: ${user.userId}`);

    socket.join(`user:${user.userId}`);

    socket.on('join:conversation', async (conversationId: string) => {
      const isMember = await verifyConversationMember(user.userId, conversationId);
      if (!isMember) {
        socket.emit('error', { message: 'Not a member of this conversation' });
        return;
      }
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('message:send', async (data: {
      conversationId: string;
      content: string;
      type?: MessageType;
      mediaUrl?: string;
    }) => {
      try {
        const message = await chatService.sendMessage(
          user.userId,
          data.conversationId,
          data.content,
          data.type ?? MessageType.TEXT,
          data.mediaUrl
        );

        io.to(`conversation:${data.conversationId}`).emit('message:new', message);
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('message:read', async (conversationId: string) => {
      try {
        await chatService.markAsRead(user.userId, conversationId);
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId: user.userId,
          readAt: new Date(),
        });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { userId: user.userId, conversationId });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId: user.userId, conversationId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.userId}`);
    });
  });

  return io;
}
