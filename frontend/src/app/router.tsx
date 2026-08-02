import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/app-layout';
import { SplashPage } from '@/features/auth/splash-page';
import { OnboardingPage } from '@/features/auth/onboarding-page';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage, OtpLoginPage } from '@/features/auth/register-page';
import { HomePage } from '@/features/home/home-page';
import { SearchPage } from '@/features/home/search-page';
import { MedicineDetailPage, PharmacyProfilePage } from '@/features/medicine/medicine-detail-page';
import { SellerDashboardPage, SellerInventoryPage } from '@/features/seller/seller-dashboard-page';
import { CartPage, OrdersPage, BuyRequestsPage } from '@/features/buyer/cart-page';
import { ChatListPage, ChatPage } from '@/features/chat/chat-page';
import { NotificationsPage } from '@/features/notifications/notifications-page';
import { ProfilePage, SettingsPage } from '@/features/profile/profile-page';
import { AdminDashboardPage } from '@/features/admin/admin-dashboard-page';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp" element={<OtpLoginPage />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/medicine/:id" element={<MedicineDetailPage />} />
          <Route path="/pharmacy/:id" element={<PharmacyProfilePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/buy-requests" element={<BuyRequestsPage />} />
          <Route path="/chat" element={<ChatListPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/seller" element={<SellerDashboardPage />} />
          <Route path="/seller/inventory" element={<SellerInventoryPage />} />
          <Route path="/seller/requests" element={<BuyRequestsPage />} />
          <Route path="/seller/orders" element={<OrdersPage />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboardPage /></AdminRoute></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
