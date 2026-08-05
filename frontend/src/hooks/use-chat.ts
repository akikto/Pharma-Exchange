import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, getSocket } from '@/lib/socket';
import type { Message } from '@/types';

function appendUniqueMessage(prev: Message[], msg: Message): Message[] {
  return prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
}

export function useChatSocket(conversationId: string | undefined, onMessage: (msg: Message) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!conversationId) return;
    const socket = connectSocket();
    let active = true;

    const joinConversation = () => {
      socket.emit('join:conversation', conversationId, (ack?: { ok?: boolean }) => {
        if (!active || ack?.ok === false) return;
      });
    };

    if (socket.connected) joinConversation();
    else socket.once('connect', joinConversation);

    const handler = (msg: Message) => onMessageRef.current(msg);
    socket.on('message:new', handler);

    return () => {
      active = false;
      socket.off('connect', joinConversation);
      socket.emit('leave:conversation', conversationId);
      socket.off('message:new', handler);
    };
  }, [conversationId]);
}

export function useChatListSocket() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = connectSocket();
    const handler = () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    };
    socket.on('message:new', handler);
    return () => {
      socket.off('message:new', handler);
    };
  }, [qc]);
}

export { appendUniqueMessage };

export function useTypingIndicator(conversationId: string | undefined) {
  const socket = getSocket();

  const startTyping = useCallback(() => {
    if (conversationId) socket.emit('typing:start', conversationId);
  }, [conversationId, socket]);

  const stopTyping = useCallback(() => {
    if (conversationId) socket.emit('typing:stop', conversationId);
  }, [conversationId, socket]);

  return { startTyping, stopTyping };
}

export function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) callback(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, hasMore]);

  return ref;
}
