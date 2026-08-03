import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStartConversation } from '@/hooks/use-api';
import { formatPhoneHref, formatWhatsAppHref } from '@/lib/offer-utils';
import type { Listing } from '@/types';

interface ContactActionsProps {
  listing: Listing;
  medicineName?: string;
  size?: 'sm' | 'md';
}

export function ContactActions({ listing, medicineName, size = 'sm' }: ContactActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startChat = useStartConversation();
  const phone = listing.pharmacy.user?.phone;
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  const handleChat = async () => {
    const userId = listing.pharmacy.userId ?? listing.pharmacy.user?.id;
    if (!userId) return;
    const conv = await startChat.mutateAsync({ participantId: userId, listingId: listing.id });
    navigate(`/chat/${conv.id}`);
  };

  const phoneHref = formatPhoneHref(phone);
  const whatsappHref = formatWhatsAppHref(
    phone,
    t('offer.whatsappMessage', { medicine: medicineName ?? listing.medicine.name }),
  );

  return (
    <div className="flex gap-1" data-testid="contact-actions">
      <Button variant="ghost" size="icon" className={btnClass} aria-label={t('listing.messageSeller')} onClick={() => void handleChat()} loading={startChat.isPending}>
        <MessageCircle className={iconClass} />
      </Button>
      {phoneHref ? (
        <Button variant="ghost" size="icon" className={btnClass} aria-label={t('offer.callSeller')} asChild>
          <a href={phoneHref}><Phone className={iconClass} /></a>
        </Button>
      ) : null}
      {whatsappHref ? (
        <Button variant="ghost" size="icon" className={btnClass} aria-label={t('offer.whatsapp')} asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer"><MessageSquare className={iconClass} /></a>
        </Button>
      ) : null}
    </div>
  );
}
