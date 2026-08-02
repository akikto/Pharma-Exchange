import { Link, useNavigate } from 'react-router-dom';
import { Settings, Moon, Sun, LogOut, Store, ShoppingBag, ChevronRight } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

export function ProfilePage() {
  const { user, mode, setMode, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const isVerified = user?.pharmacy?.verificationStatus === 'APPROVED';
  const hasPharmacy = Boolean(user?.pharmacy);

  return (
    <div>
      <TopBar title="Profile" />
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-subtle flex items-center justify-center text-2xl font-bold text-primary">
            {user?.firstName?.[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-text-secondary">{user?.email || user?.phone}</p>
            {user?.pharmacy && <p className="text-xs text-primary mt-0.5">{user.pharmacy.name} · {user.pharmacy.verificationStatus}</p>}
            {!hasPharmacy && (
              <Link to="/pharmacy/register" className="text-xs text-primary mt-1 inline-block">Register your pharmacy →</Link>
            )}
          </div>
        </div>

        {isVerified && (
          <div className="flex gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]">
            <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-sm ${mode === 'buyer' ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => { setMode('buyer'); navigate('/'); }}>
              <ShoppingBag className="h-4 w-4" /> Buying
            </button>
            <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] text-sm ${mode === 'seller' ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => { setMode('seller'); navigate('/seller'); }}>
              <Store className="h-4 w-4" /> Selling
            </button>
          </div>
        )}

        <div className="space-y-1">
          <Link to="/orders" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised">
            <span>Order History</span><ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
          <Link to="/buy-requests" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised">
            <span>Buy Requests</span><ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
          <Link to="/settings" className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</span><ChevronRight className="h-4 w-4 text-text-secondary" />
          </Link>
          <button className="w-full flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-surface-raised" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <span className="flex items-center gap-2">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme</span>
            <span className="text-sm text-text-secondary capitalize">{theme}</span>
          </button>
        </div>

        <Button variant="destructive" className="w-full" onClick={() => logout()}>
          <LogOut className="h-4 w-4" /> Log Out
        </Button>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuthStore();
  return (
    <div>
      <TopBar title="Settings" showBack />
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <select className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle px-3 text-sm" defaultValue={user?.language || 'en'}>
            <option value="en">English</option>
            <option value="bn">বাংলা</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Notification Preferences</label>
          <div className="space-y-2">
            {['Buy requests', 'Order updates', 'Chat messages', 'Promotions'].map((pref) => (
              <label key={pref} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <span className="text-sm">{pref}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
