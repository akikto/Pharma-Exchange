import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/app-layout';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Skeleton } from '@/components/ui/skeleton';

const SplashPage = lazy(() => import('@/features/auth/splash-page').then(m => ({ default: m.SplashPage })));
const OnboardingPage = lazy(() => import('@/features/auth/onboarding-page').then(m => ({ default: m.OnboardingPage })));
const LoginPage = lazy(() => import('@/features/auth/login-page').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/reset-password-page').then(m => ({ default: m.ResetPasswordPage })));
const HomePage = lazy(() => import('@/features/home/home-page').then(m => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('@/features/home/search-page').then(m => ({ default: m.SearchPage })));
const loadMedicineDetail = () => import('@/features/medicine/medicine-detail-page');
const MedicineDetailPage = lazy(() => loadMedicineDetail().then(m => ({ default: m.MedicineDetailPage })));
const PharmacyProfilePage = lazy(() => loadMedicineDetail().then(m => ({ default: m.PharmacyProfilePage })));
const ComparisonPage = lazy(() => import('@/features/medicine/comparison-page').then(m => ({ default: m.ComparisonPage })));
const SellerDashboardPage = lazy(() => import('@/features/seller/seller-dashboard-page').then(m => ({ default: m.SellerDashboardPage })));
const SellerInventoryPage = lazy(() => import('@/features/seller/seller-inventory-page').then(m => ({ default: m.SellerInventoryPage })));
const SellerAnalyticsPage = lazy(() => import('@/features/seller/seller-analytics-page').then(m => ({ default: m.SellerAnalyticsPage })));
const ListingFormPage = lazy(() => import('@/features/seller/listing-form-page').then(m => ({ default: m.ListingFormPage })));
const PharmacyRegisterPage = lazy(() => import('@/features/seller/pharmacy-register-page').then(m => ({ default: m.PharmacyRegisterPage })));
const RequestsHubPage = lazy(() => import('@/features/buyer/requests-hub-page').then(m => ({ default: m.RequestsHubPage })));
const SellerOrdersPage = lazy(() => import('@/features/seller/seller-orders-page').then(m => ({ default: m.SellerOrdersPage })));
const SellerRequestsPage = lazy(() => import('@/features/seller/seller-requests-page').then(m => ({ default: m.SellerRequestsPage })));
const OrderDetailPage = lazy(() => import('@/features/buyer/order-detail-page').then(m => ({ default: m.OrderDetailPage })));
const BuyRequestDetailPage = lazy(() => import('@/features/buyer/buy-request-detail-page').then(m => ({ default: m.BuyRequestDetailPage })));
const loadChat = () => import('@/features/chat/chat-page');
const ChatListPage = lazy(() => loadChat().then(m => ({ default: m.ChatListPage })));
const ChatPage = lazy(() => loadChat().then(m => ({ default: m.ChatPage })));
const WatchlistPage = lazy(() => import('@/features/watchlist/watchlist-page').then(m => ({ default: m.WatchlistPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/notifications-page').then(m => ({ default: m.NotificationsPage })));
const loadProfile = () => import('@/features/profile/profile-page');
const ProfilePage = lazy(() => loadProfile().then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => loadProfile().then(m => ({ default: m.SettingsPage })));
const loadAdmin = () => import('@/features/admin/admin-dashboard-page');
const AdminDashboardPage = lazy(() => loadAdmin().then(m => ({ default: m.AdminDashboardPage })));
const AdminVerificationsPage = lazy(() => loadAdmin().then(m => ({ default: m.AdminVerificationsPage })));
const AdminReportsPage = lazy(() => loadAdmin().then(m => ({ default: m.AdminReportsPage })));
const AdminPaymentsPage = lazy(() => import('@/features/admin/admin-payments-page').then(m => ({ default: m.AdminPaymentsPage })));
const AdminMedicinesPage = lazy(() => import('@/features/admin/admin-medicines-page').then(m => ({ default: m.AdminMedicinesPage })));
const AdminBannersPage = lazy(() => import('@/features/admin/admin-banners-page').then(m => ({ default: m.AdminBannersPage })));
const AdminSellersPage = lazy(() => import('@/features/admin/admin-sellers-page').then(m => ({ default: m.AdminSellersPage })));
const PrivacyPolicyPage = lazy(() => import('@/features/legal/privacy-policy-page').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsAndConditionsPage = lazy(() => import('@/features/legal/terms-and-conditions-page').then(m => ({ default: m.TermsAndConditionsPage })));

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
          <Route path="/register" element={<Navigate to="/login?tab=register" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/otp" element={<Navigate to="/login" replace />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
          <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/medicine/:medicineId/compare" element={<ComparisonPage />} />
            <Route path="/medicine/:id" element={<MedicineDetailPage />} />
            <Route path="/pharmacy/:id" element={<PharmacyProfilePage />} />
            <Route path="/cart" element={<RequestsHubPage />} />
            <Route path="/orders" element={<Navigate to="/cart?tab=orders" replace />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/buy-requests" element={<Navigate to="/cart?tab=requests" replace />} />
            <Route path="/buy-requests/:id" element={<BuyRequestDetailPage />} />
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />
            <Route path="/seller" element={<SellerDashboardPage />} />
            <Route path="/seller/inventory" element={<SellerRoute><SellerInventoryPage /></SellerRoute>} />
            <Route path="/seller/requests" element={<SellerRoute><SellerRequestsPage /></SellerRoute>} />
            <Route path="/seller/requests/:id" element={<SellerRoute><BuyRequestDetailPage /></SellerRoute>} />
            <Route path="/seller/orders" element={<SellerRoute><SellerOrdersPage /></SellerRoute>} />
            <Route path="/seller/orders/:id" element={<SellerRoute><OrderDetailPage /></SellerRoute>} />
            <Route path="/seller/analytics" element={<SellerRoute><SellerAnalyticsPage /></SellerRoute>} />
            <Route path="/seller/listing/new" element={<SellerRoute><ListingFormPage /></SellerRoute>} />
            <Route path="/seller/listing/:id" element={<SellerRoute><ListingFormPage /></SellerRoute>} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="verifications" element={<AdminVerificationsPage />} />
            <Route path="sellers" element={<AdminSellersPage />} />
            <Route path="medicines" element={<AdminMedicinesPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
