import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, Mic } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ChatHeader } from '@/components/chat/chat-header';
import { ChatContextFilterBar } from '@/components/chat/chat-context-filter';
import { apiClient } from '@/lib/api';
import { useChatSocket } from '@/hooks/use-chat';
import { useConversations, useConversation } from '@/hooks/use-chat-api';
import type { ChatContextFilter } from '@/lib/chat-utils';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export function ChatListPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ChatContextFilter>({ type: 'all' });
  const { data, isLoading } = useConversations(filter);
  const userId = useAuthStore((s) => s.user?.id);

  return (
    <div>
      <TopBar title={t('chat.title')} />
      <ChatContextFilterBar value={filter} onChange={setFilter} />
      <div className="p-4 pt-0">
        {isLoading ? <ListSkeleton /> : !data?.length ? (
          <p className="text-center text-text-secondary py-12">{t('chat.empty')}</p>
        ) : (
          <div className="space-y-2">
            {data.map((conv) => {
              const other = conv.members.find((m) => m.user.id !== userId);
              const lastMsg = conv.messages[0];
              return (
                <Link key={conv.id} to={`/chat/${conv.id}`} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-surface-raised border border-border-subtle">
                  <div className="h-10 w-10 rounded-full bg-primary-subtle flex items-center justify-center font-medium text-primary">
                    {other?.user.firstName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{other?.user.firstName} {other?.user.lastName}</p>
                    <p className={cn('text-xs truncate', lastMsg?.type === 'SYSTEM' ? 'text-primary italic' : 'text-text-secondary')}>
                      {lastMsg?.content}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const userId = useAuthStore((s) => s.user?.id);

  const { data: conversation, isLoading: convLoading } = useConversation(id);
  const { data: initialMessages, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => apiClient.get<{ data: Message[] }>(`/chat/conversations/${id}/messages`),
    enabled: !!id,
  });

  const refreshMessages = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['messages', id] });
    qc.invalidateQueries({ queryKey: ['conversation', id] });
  }, [qc, id]);

  useEffect(() => {
    if (initialMessages?.data) setMessages(initialMessages.data);
  }, [initialMessages]);

  useChatSocket(id, (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      apiClient.post<Message>(`/chat/conversations/${id}/messages`, { content }),
    onSuccess: (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      apiClient.post(`/chat/conversations/${id}/read`);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate(input);
    setInput('');
    apiClient.post(`/chat/conversations/${id}/read`);
  };

  if (convLoading || msgLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (!conversation) return <div className="p-4 text-center text-danger">{t('common.error')}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <TopBar showBack />
      <ChatHeader conversation={conversation} onRefreshMessages={refreshMessages} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          if (msg.type === 'SYSTEM') {
            return (
              <div key={msg.id} className="flex justify-center" data-testid="chat-system-message">
                <p className="text-xs text-text-secondary bg-surface-sunken px-3 py-1.5 rounded-full italic text-center max-w-[90%]">
                  {msg.content}
                </p>
              </div>
            );
          }

          const isOwn = msg.sender.id === userId;
          return (
            <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2 text-sm',
                isOwn ? 'bg-primary text-white' : 'bg-surface-raised',
              )}>
                {msg.type === 'IMAGE' && msg.mediaUrl ? (
                  <img src={msg.mediaUrl} alt="" className="rounded max-w-full" />
                ) : (
                  <p>{msg.content}</p>
                )}
                <p className={cn('text-[10px] mt-1', isOwn ? 'text-white/70' : 'text-text-secondary')}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isOwn && (msg.isRead ? ' ✓✓' : ' ✓')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-border-subtle flex gap-2 items-center safe-bottom">
        <Button variant="ghost" size="icon" aria-label={t('chat.attach')}><Paperclip className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" aria-label={t('chat.voice')}><Mic className="h-5 w-5" /></Button>
        <Input className="flex-1" placeholder={t('chat.placeholder')} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
        <Button size="icon" aria-label={t('chat.send')} onClick={handleSend} loading={sendMessage.isPending}><Send className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
