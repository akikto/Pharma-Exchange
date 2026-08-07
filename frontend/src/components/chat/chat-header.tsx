import { useTranslation } from 'react-i18next';
import { Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPhoneHref, formatWhatsAppHref } from '@/lib/offer-utils';
import {
  getSellerBuyRequestActions,
  getSellerOrderAction,
} from '@/lib/chat-utils';
import {
  useUpdateOrderStatus,
  useRespondBuyRequest,
  type ChatConversationDetail,
} from '@/hooks/use-chat-api';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

interface ChatHeaderProps {
  conversation: ChatConversationDetail;
  onRefreshMessages: () => void;
}

export function ChatHeader({ conversation, onRefreshMessages }: ChatHeaderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const userId = useAuthStore((s) => s.user?.id);
  const pharmacy = useAuthStore((s) => s.user?.pharmacy);
  const updateOrder = useUpdateOrderStatus();
  const respondRequest = useRespondBuyRequest();
  const pendingAction = respondRequest.isPending ? respondRequest.variables?.action ?? null : null;

  const counterparty = conversation.counterparty;
  const name = counterparty ? `${counterparty.firstName} ${counterparty.lastName}`.trim() : t('chat.title');
  const phoneHref = formatPhoneHref(counterparty?.phone);
  const whatsappHref = formatWhatsAppHref(counterparty?.phone, t('chat.whatsappGreeting'));

  const isSellerOnOrder = Boolean(
    conversation.order && pharmacy?.id && conversation.order.seller?.userId === userId,
  );
  const isSellerOnRequest = Boolean(
    conversation.buyRequest && pharmacy?.id && conversation.buyRequest.seller?.userId === userId,
  );

  const orderAction = isSellerOnOrder && conversation.order
    ? getSellerOrderAction(conversation.order.status)
    : null;
  const requestActions = isSellerOnRequest && conversation.buyRequest
    ? getSellerBuyRequestActions(conversation.buyRequest.status)
    : [];

  const handleOrderStatus = async (status: string) => {
    if (!conversation.order) return;
    try {
      await updateOrder.mutateAsync({ orderId: conversation.order.id, status });
      toast({ description: t('chat.statusUpdated') });
      onRefreshMessages();
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleRequestAction = async (action: 'accept' | 'reject') => {
    if (!conversation.buyRequest || respondRequest.isPending) return;
    try {
      await respondRequest.mutateAsync({ id: conversation.buyRequest.id, action });
      toast({ description: t('chat.requestUpdated') });
      onRefreshMessages();
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="border-b border-border-subtle bg-surface-raised px-4 py-3 space-y-2" data-testid="chat-header">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{name}</p>
          {conversation.order && (
            <p className="text-xs text-text-secondary">{conversation.order.orderNumber} · {conversation.order.status}</p>
          )}
          {conversation.buyRequest && !conversation.order && (
            <p className="text-xs text-text-secondary">{conversation.buyRequest.requestNumber} · {conversation.buyRequest.status}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {phoneHref && (
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild aria-label={t('offer.callSeller')}>
              <a href={phoneHref}><Phone className="h-4 w-4" /></a>
            </Button>
          )}
          {whatsappHref && (
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild aria-label={t('offer.whatsapp')}>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer"><MessageSquare className="h-4 w-4" /></a>
            </Button>
          )}
        </div>
      </div>

      {(orderAction || requestActions.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {orderAction && (
            <Button size="sm" onClick={() => handleOrderStatus(orderAction.status!)} loading={updateOrder.isPending}>
              {t(orderAction.labelKey)}
            </Button>
          )}
          {requestActions.map((action) => (
            <Button
              key={action.key}
              size="sm"
              variant={action.action === 'reject' ? 'secondary' : 'primary'}
              onClick={() => void handleRequestAction(action.action!)}
              loading={pendingAction === action.action}
              disabled={respondRequest.isPending}
              data-testid={`chat-buy-request-${action.action}-button`}
            >
              {t(action.labelKey)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
