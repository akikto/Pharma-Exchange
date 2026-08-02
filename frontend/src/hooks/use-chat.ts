import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import type { Message } from '@/types';

export function useChatSocket(conversationId: string | undefined, onMessage: (msg: Message) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!conversationId) return;
    const socket = connectSocket();
    socket.emit('join:conversation', conversationId);

    const handler = (msg: Message) => onMessageRef.current(msg);
    socket.on('message:new', handler);

    return () => {
      socket.emit('leave:conversation', conversationId);
      socket.off('message:new', handler);
    };
  }, [conversationId]);
}

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
