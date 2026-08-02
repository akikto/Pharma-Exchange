import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Paperclip, Mic } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import { useChatSocket } from '@/hooks/use-chat';
import type { Conversation, Message } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export function ChatListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get<Conversation[]>('/chat/conversations'),
  });

  return (
    <div>
      <TopBar title="Messages" />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : !data?.length ? (
          <p className="text-center text-text-secondary py-12">No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {data.map((conv) => {
              const other = conv.members.find((m) => m.user.id !== useAuthStore.getState().user?.id);
              const lastMsg = conv.messages[0];
              return (
                <Link key={conv.id} to={`/chat/${conv.id}`} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-surface-raised">
                  <div className="h-10 w-10 rounded-full bg-primary-subtle flex items-center justify-center font-medium text-primary">
                    {other?.user.firstName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{other?.user.firstName} {other?.user.lastName}</p>
                    <p className="text-xs text-text-secondary truncate">{lastMsg?.content}</p>
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
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const userId = useAuthStore((s) => s.user?.id);

  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => apiClient.get<{ data: Message[] }>(`/chat/conversations/${id}/messages`),
    enabled: !!id,
  });

  useEffect(() => {
    if (initialMessages?.data) setMessages(initialMessages.data);
  }, [initialMessages]);

  useChatSocket(id, (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => apiClient.post(`/chat/conversations/${id}/messages`, { content }),
    onSuccess: () => {
      apiClient.post(`/chat/conversations/${id}/read`);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate(input);
    setInput('');
    apiClient.post(`/chat/conversations/${id}/read`);
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <TopBar showBack />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender.id === userId;
          return (
            <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2 text-sm',
                isOwn ? 'bg-primary text-white' : 'bg-surface-raised'
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
        {false && <p className="text-xs text-text-secondary">Typing...</p>}
      </div>
      <div className="p-3 border-t border-border-subtle flex gap-2 items-center safe-bottom">
        <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon"><Mic className="h-5 w-5" /></Button>
        <Input className="flex-1" placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
        <Button size="icon" onClick={handleSend}><Send className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
