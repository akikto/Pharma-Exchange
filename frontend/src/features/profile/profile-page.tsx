import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Moon, Sun, LogOut, Store, ShoppingBag, ChevronRight } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useUpdateProfile } from '@/hooks/use-user-settings';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '@/components/pharmacy/verified-badge';
import { normalizeNotificationPrefs } from '@/lib/notification-prefs';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import type { NotificationPrefs } from '@/lib/notification-prefs';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, mode, setMode, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const isVerified = user?.pharmacy?.verificationStatus === 'APPROVED';
  const hasPharmacy = Boolean(user?.pharmacy);

  const handleLogout = () => {
    logout();
    toast({ description: t('toast.logoutSuccess') });
  };

  return (
    <div>
      <TopBar title={t('profile.title')} />
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-subtle flex items-center justify-center text-2xl font-bold text-primary">
            {user?.firstName?.[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-text-secondary">{user?.email || user?.phone}</p>
            {user?.pharmacy && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-primary">{user.pharmacy.name}</p>
                {user.pharmacy.verificationStatus === 'APPROVED' && <VerifiedBadge size="sm" />}
                {user.pharmacy.verificationStatus !== 'APPROVED' && (
                  <span className="text-xs text-text-secondary">{user.pharmacy.verificationStatus}</span>
                )}
              </div>
            )}
            {!hasPharmacy && (
              <Link to="/pharmacy/register" className="text-xs text-primary mt-1 inline-block">{t('profile.registerPharmacy')}</Link>
            )}
          </div>
        </div>

        {isVerified && (
          <div className="flex gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]">
            <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-sm ${mode === 'buyer' ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => { setMode('buyer', { userSet: true }); navigate('/'); }}>
              <ShoppingBag className="h-4 w-4" /> {t('profile.buying')}
            </button>
            <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-sm ${mode === 'seller' ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => { setMode('seller', { userSet: true }); navigate('/seller'); }}>
              <Store className="h-4 w-4" /> {t('profile.selling')}
            </button>
          </div>
        )}

        <div className="space-y-1">
          <button
            type="button"
            className="w-full flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised"
            onClick={() => setEditOpen(true)}
            data-testid="edit-profile-button"
          >
            <span>{t('profile.editTitle')}</span>
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </button>
          <Link to="/cart?tab=orders" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised">
            <span>{t('profile.orderHistory')}</span><ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
          <Link to="/cart?tab=requests" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised">
            <span>{t('profile.buyRequests')}</span><ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
          <Link to="/settings" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> {t('profile.settings')}</span><ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
          <button
            className="w-full flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised"
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark';
              setTheme(next);
              void updateProfile.mutateAsync({ theme: next }).catch(() => undefined);
            }}
          >
            <span className="flex items-center gap-2">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {t('profile.theme')}</span>
            <span className="text-sm text-text-secondary capitalize">{theme}</span>
          </button>
        </div>

        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> {t('profile.logout')}
        </Button>
      </div>
      <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const prefs = normalizeNotificationPrefs(user?.notificationPrefs);

  const togglePref = (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    void updateProfile.mutateAsync({ notificationPrefs: next }).then(() => {
      toast({ description: t('toast.settingsSaved') });
    }).catch(() => undefined);
  };

  return (
    <div>
      <TopBar title={t('profile.settings')} showBack />
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('profile.notificationPrefs')}</label>
          <div className="space-y-2">
            {([
              ['prefBuyRequests', 'buyRequests'],
              ['prefOrders', 'orders'],
              ['prefChat', 'chat'],
              ['prefPromotions', 'promotions'],
            ] as const).map(([labelKey, prefKey]) => (
              <label key={prefKey} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <span className="text-sm">{t(`profile.${labelKey}`)}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={prefs[prefKey]}
                  onChange={() => togglePref(prefKey)}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2" data-testid="settings-legal-links">
          <label className="text-sm font-medium">{t('profile.legal', { defaultValue: 'Legal' })}</label>
          <div className="grid grid-cols-1 gap-2">
            <Link
              to="/privacy-policy"
              data-testid="settings-privacy-link"
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-subtle p-3 text-sm hover:bg-surface-muted"
            >
              <span>Privacy Policy</span>
              <span aria-hidden>→</span>
            </Link>
            <Link
              to="/terms-and-conditions"
              data-testid="settings-terms-link"
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-subtle p-3 text-sm hover:bg-surface-muted"
            >
              <span>Terms &amp; Conditions</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
