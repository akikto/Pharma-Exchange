import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPhoneHref, formatWhatsAppHref } from '@/lib/offer-utils';
import { useStartConversation } from '@/hooks/use-api';

interface PharmacyContactActionsProps {
  ownerId?: string;
  phone?: string | null;
  pharmacyName: string;
}

export function PharmacyContactActions({ ownerId, phone, pharmacyName }: PharmacyContactActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startChat = useStartConversation();

  const phoneHref = formatPhoneHref(phone);
  const whatsappHref = formatWhatsAppHref(
    phone,
    t('shop.whatsappGreeting', { name: pharmacyName }),
  );

  const handleChat = async () => {
    if (!ownerId) return;
    const conv = await startChat.mutateAsync({ participantId: ownerId });
    navigate(`/chat/${conv.id}`);
  };

  return (
    <div className="flex flex-wrap gap-2" data-testid="pharmacy-contact-actions">
      {phoneHref && (
        <Button variant="secondary" size="sm" asChild>
          <a href={phoneHref}>
            <Phone className="h-4 w-4 mr-1" />
            {t('offer.callSeller')}
          </a>
        </Button>
      )}
      {whatsappHref && (
        <Button variant="secondary" size="sm" asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="h-4 w-4 mr-1" />
            {t('offer.whatsapp')}
          </a>
        </Button>
      )}
      {ownerId && (
        <Button variant="secondary" size="sm" onClick={() => void handleChat()} loading={startChat.isPending}>
          <MessageCircle className="h-4 w-4 mr-1" />
          {t('listing.messageSeller')}
        </Button>
      )}
    </div>
  );
}
