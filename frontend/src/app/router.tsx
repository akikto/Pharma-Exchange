import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

const SplashPage = lazy(() => import('@/features/auth/splash-page').then(m => ({ default: m.SplashPage })));
const OnboardingPage = lazy(() => import('@/features/auth/onboarding-page').then(m => ({ default: m.OnboardingPage })));
const LoginPage = lazy(() => import('@/features/auth/login-page').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/register-page').then(m => ({ default: m.RegisterPage })));
const OtpLoginPage = lazy(() => import('@/features/auth/register-page').then(m => ({ default: m.OtpLoginPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const VerifyEmailOtpPage = lazy(() => import('@/features/auth/forgot-password-page').then(m => ({ default: m.VerifyEmailOtpPage })));
const HomePage = lazy(() => import('@/features/home/home-page').then(m => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('@/features/home/search-page').then(m => ({ default: m.SearchPage })));
const MedicineDetailPage = lazy(() => import('@/features/medicine/medicine-detail-page').then(m => ({ default: m.MedicineDetailPage })));
const PharmacyProfilePage = lazy(() => import('@/features/medicine/medicine-detail-page').then(m => ({ default: m.PharmacyProfilePage })));
const SellerDashboardPage = lazy(() => import('@/features/seller/seller-dashboard-page').then(m => ({ default: m.SellerDashboardPage })));
const SellerInventoryPage = lazy(() => import('@/features/seller/seller-dashboard-page').then(m => ({ default: m.SellerInventoryPage })));
const SellerAnalyticsPage = lazy(() => import('@/features/seller/seller-analytics-page').then(m => ({ default: m.SellerAnalyticsPage })));
const ListingFormPage = lazy(() => import('@/features/seller/listing-form-page').then(m => ({ default: m.ListingFormPage })));
const PharmacyRegisterPage = lazy(() => import('@/features/seller/pharmacy-register-page').then(m => ({ default: m.PharmacyRegisterPage })));
const CartPage = lazy(() => import('@/features/buyer/cart-page').then(m => ({ default: m.CartPage })));
const OrdersPage = lazy(() => import('@/features/buyer/cart-page').then(m => ({ default: m.OrdersPage })));
const BuyRequestsPage = lazy(() => import('@/features/buyer/cart-page').then(m => ({ default: m.BuyRequestsPage })));
const OrderDetailPage = lazy(() => import('@/features/buyer/order-detail-page').then(m => ({ default: m.OrderDetailPage })));
const BuyRequestDetailPage = lazy(() => import('@/features/buyer/buy-request-detail-page').then(m => ({ default: m.BuyRequestDetailPage })));
const ChatListPage = lazy(() => import('@/features/chat/chat-page').then(m => ({ default: m.ChatListPage })));
const ChatPage = lazy(() => import('@/features/chat/chat-page').then(m => ({ default: m.ChatPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/notifications-page').then(m => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('@/features/profile/profile-page').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/features/profile/profile-page').then(m => ({ default: m.SettingsPage })));
const AdminDashboardPage = lazy(() => import('@/features/admin/admin-dashboard-page').then(m => ({ default: m.AdminDashboardPage })));
const AdminVerificationsPage = lazy(() => import('@/features/admin/admin-dashboard-page').then(m => ({ default: m.AdminVerificationsPage })));
const AdminReportsPage = lazy(() => import('@/features/admin/admin-dashboard-page').then(m => ({ default: m.AdminReportsPage })));

function PageLoader() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SellerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user?.pharmacy) return <Navigate to="/pharmacy/register" replace />;
  if (user.pharmacy.verificationStatus !== 'APPROVED') return <Navigate to="/profile" replace />;
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/splash" element={<SplashPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email-otp" element={<VerifyEmailOtpPage />} />
          <Route path="/otp" element={<OtpLoginPage />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/medicine/:id" element={<MedicineDetailPage />} />
            <Route path="/pharmacy/:id" element={<PharmacyProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/buy-requests" element={<BuyRequestsPage />} />
            <Route path="/buy-requests/:id" element={<BuyRequestDetailPage />} />
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />
            <Route path="/seller" element={<SellerRoute><SellerDashboardPage /></SellerRoute>} />
            <Route path="/seller/inventory" element={<SellerRoute><SellerInventoryPage /></SellerRoute>} />
            <Route path="/seller/requests" element={<SellerRoute><BuyRequestsPage /></SellerRoute>} />
            <Route path="/seller/requests/:id" element={<SellerRoute><BuyRequestDetailPage /></SellerRoute>} />
            <Route path="/seller/orders" element={<SellerRoute><OrdersPage /></SellerRoute>} />
            <Route path="/seller/analytics" element={<SellerRoute><SellerAnalyticsPage /></SellerRoute>} />
            <Route path="/seller/listing/new" element={<SellerRoute><ListingFormPage /></SellerRoute>} />
            <Route path="/seller/listing/:id" element={<SellerRoute><ListingFormPage /></SellerRoute>} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboardPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute><AdminRoute><AdminVerificationsPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><AdminRoute><AdminReportsPage /></AdminRoute></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
