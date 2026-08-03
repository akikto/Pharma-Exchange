import { useTranslation } from 'react-i18next';
import type { ChatContextFilter } from '@/lib/chat-utils';
import { useChatContextOptions } from '@/hooks/use-chat-api';

interface ChatContextFilterProps {
  value: ChatContextFilter;
  onChange: (filter: ChatContextFilter) => void;
}

export function ChatContextFilterBar({ value, onChange }: ChatContextFilterProps) {
  const { t } = useTranslation();
  const { data } = useChatContextOptions();

  return (
    <div className="px-4 pb-3" data-testid="chat-context-filter">
      <label className="text-xs text-text-secondary block mb-1">{t('chat.filterLabel')}</label>
      <select
        className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-3 py-2 text-sm"
        value={value.type === 'all' ? 'all' : value.type === 'order' ? `order:${value.id}` : `request:${value.id}`}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'all') onChange({ type: 'all' });
          else if (v.startsWith('order:')) onChange({ type: 'order', id: v.slice(6) });
          else if (v.startsWith('request:')) onChange({ type: 'buyRequest', id: v.slice(8) });
        }}
      >
        <option value="all">{t('chat.filterAll')}</option>
        {data?.orders.map((o) => (
          <option key={o.id} value={`order:${o.id}`}>{t('chat.filterOrder', { number: o.orderNumber })}</option>
        ))}
        {data?.buyRequests.map((r) => (
          <option key={r.id} value={`request:${r.id}`}>{t('chat.filterRequest', { number: r.requestNumber })}</option>
        ))}
      </select>
    </div>
  );
}
