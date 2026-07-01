import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './routes';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { authService } from './services/endpoints/authService';
import { cacheKeys, cacheService } from './services/cache';
import type { User } from './types';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { WorkshopRegisterPage } from './pages/auth/WorkshopRegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { WorkshopDirectoryPage } from './pages/customer/WorkshopDirectoryPage';
import { WorkshopProfilePage } from './pages/customer/WorkshopProfilePage';
import { ProductCatalogPage } from './pages/customer/ProductCatalogPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderHistoryPage } from './pages/customer/OrderHistoryPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { PaymentPage } from './pages/customer/PaymentPage';
import { BatchPaymentPage } from './pages/customer/BatchPaymentPage';
import { MomoReturnPage } from './pages/customer/MomoReturnPage';
import { PostTenderPage } from './pages/customer/PostTenderPage';
import { DesignStudioPage } from './pages/customer/DesignStudioPage';
import { MyTendersPage } from './pages/customer/MyTendersPage';
import { TenderQuotesPage } from './pages/customer/TenderQuotesPage';
import { MyReviewsPage } from './pages/customer/MyReviewsPage';
import { CustomerMessagesPage } from './pages/customer/MessagesPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { AddressManagementPage } from './pages/customer/AddressManagementPage';

// Workshop Pages
import { WorkshopDashboardPage } from './pages/workshop/DashboardPage';
import { WorkshopProductManagementPage } from './pages/workshop/ProductManagementPage';
import { WorkshopOrderManagementPage } from './pages/workshop/OrderManagementPage';
import { WorkshopTenderMarketplacePage } from './pages/workshop/TenderMarketplacePage';
import { WorkshopTenderDetailPage } from './pages/workshop/WorkshopTenderDetailPage';
import { QuoteManagementPage } from './pages/workshop/QuoteManagementPage';
import { WorkshopFinancialPage } from './pages/workshop/FinancialPage';
import { WorkshopProfileSettingsPage } from './pages/workshop/ProfileSettingsPage';
import { MessagesPage } from './pages/workshop/MessagesPage';
import { ProfileSetupPage } from './pages/workshop/ProfileSetupPage';
import { ProductionManagementPage, CustomOrderManagementPage } from './pages/workshop/ProductionManagementPage';
import { WorkshopOrderDetailPage } from './pages/workshop/WorkshopOrderDetailPage';
import { WorkshopReviewsPage } from './pages/workshop/WorkshopReviewsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/DashboardPage';
import { AdminWorkshopAuditPage } from './pages/admin/WorkshopAuditPage';
import { AdminUserManagementPage } from './pages/admin/UserManagementPage';
import { AdminWithdrawalManagementPage } from './pages/admin/WithdrawalManagementPage';
import { AdminCMSPage } from './pages/admin/CMSPage';
import { AdminSettingsPage } from './pages/admin/SettingsPage';
import { AdminCouponManagementPage } from './pages/admin/CouponManagementPage';
import { AdminProductAuditPage } from './pages/admin/ProductAuditPage';
import { AdminMessagesPage } from './pages/admin/MessagesPage';
import { AdminComplaintManagementPage } from './pages/admin/ComplaintManagementPage';
import { AdminDisputeManagementPage } from './pages/admin/DisputeManagementPage';

export function App() {
  const { login, logout, isAuthenticated, user } = useAuthStore();
  const { fetchCart, reset: resetCart } = useCartStore();
  const [authReady, setAuthReady] = useState(false);

  // Khởi tạo auth từ token đã lưu trong localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthReady(true);
      return;
    }
    // Nếu store đã có user (persist), không cần gọi lại
    if (isAuthenticated) {
      setAuthReady(true);
      return;
    }

    const cachedUser = cacheService.get<User>(cacheKeys.customerProfile);
    if (cachedUser) {
      login(cachedUser, token);
      setAuthReady(true);
      authService.getCurrentUser()
        .then((res) => {
          const user = res.data.data;
          const normalizedUser = {
            ...user,
            role: (user.role?.toLowerCase() ?? 'customer') as User['role'],
          };
          login(normalizedUser, token);
          cacheService.set(cacheKeys.customerProfile, normalizedUser, 30 * 60 * 1000);
        })
        .catch(() => {
          logout();
          resetCart();
        });
      return;
    }

    // Token có nhưng store chưa có user — gọi /auth/me để restore session
    authService.getCurrentUser()
      .then((res) => {
        const user = res.data.data;
        const normalizedUser = {
          ...user,
          role: (user.role?.toLowerCase() ?? 'customer') as User['role'],
        };
        login(normalizedUser, token);
        cacheService.set(cacheKeys.customerProfile, normalizedUser, 30 * 60 * 1000);
      })
      .catch(() => {
        // Token hết hạn hoặc không hợp lệ
        logout();
        resetCart();
      })
      .finally(() => setAuthReady(true));
  }, []);

  // Fetch cart sau khi auth ready — chỉ customer mới có giỏ hàng
  useEffect(() => {
    if (authReady && isAuthenticated && user?.role === 'customer') {
      fetchCart();
    }
  }, [authReady, isAuthenticated, user?.role]);

  // Chờ auth khởi tạo xong mới render app để tránh flash "chưa đăng nhập"
  if (!authReady) return null;

  return (
    <Router>
      <Routes>
        {/* Customer routes — public */}
        <Route path="/" element={<Outlet />}>
          <Route index element={<HomePage />} />
          <Route path="workshop-directory" element={<WorkshopDirectoryPage />} />
          <Route path="workshop/:id" element={<WorkshopProfilePage />} />
          <Route path="products" element={<ProductCatalogPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/:id/payment" element={<PaymentPage />} />
          <Route path="payment/batch/:batchId" element={<BatchPaymentPage />} />
          <Route path="payment/momo-return" element={<MomoReturnPage />} />
          <Route path="create-tender" element={
            <ProtectedRoute requiredRoles={['customer']}>
              <PostTenderPage />
            </ProtectedRoute>
          } />
          <Route path="design-studio" element={
            <ProtectedRoute requiredRoles={['customer']}>
              <DesignStudioPage />
            </ProtectedRoute>
          } />
          <Route path="my-tenders" element={
            <ProtectedRoute requiredRoles={['customer']}>
              <MyTendersPage />
            </ProtectedRoute>
          } />
          <Route path="my-tenders/:postId" element={
            <ProtectedRoute requiredRoles={['customer']}>
              <TenderQuotesPage />
            </ProtectedRoute>
          } />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="addresses" element={<AddressManagementPage />} />
          <Route path="reviews" element={
            <ProtectedRoute requiredRoles={['customer']}>
              <MyReviewsPage />
            </ProtectedRoute>
          } />
          <Route path="messages" element={
            <ProtectedRoute requiredRoles={['customer']}>
              <CustomerMessagesPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Workshop routes — protected */}
        <Route
          path="/workshop"
          element={
            <ProtectedRoute requiredRoles={['workshop']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<WorkshopDashboardPage />} />
          <Route path="products" element={<WorkshopProductManagementPage />} />
          <Route path="production" element={<WorkshopOrderManagementPage />} />
          <Route path="production/:orderId" element={<WorkshopOrderDetailPage />} />
          <Route path="production-management" element={<CustomOrderManagementPage />} />
          <Route path="ready-made-orders" element={<ProductionManagementPage />} />
          <Route path="marketplace" element={<WorkshopTenderMarketplacePage />} />
          <Route path="marketplace/:postId" element={<WorkshopTenderDetailPage />} />
          <Route path="submit-quote" element={<QuoteManagementPage />} />
          <Route path="quotes" element={<QuoteManagementPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="reviews" element={<WorkshopReviewsPage />} />
          <Route path="finance" element={<WorkshopFinancialPage />} />
          <Route path="settings" element={<ProfileSetupPage />} />
          <Route path="settings-legacy" element={<WorkshopProfileSettingsPage />} />
          <Route path="profile-setup" element={<ProfileSetupPage />} />
        </Route>

        {/* Admin routes — protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="audit" element={<AdminWorkshopAuditPage />} />
          <Route path="products" element={<AdminProductAuditPage />} />
          <Route path="users" element={<AdminUserManagementPage />} />
          <Route path="withdrawals" element={<AdminWithdrawalManagementPage />} />
          <Route path="complaints" element={<AdminComplaintManagementPage />} />
          <Route path="disputes" element={<AdminDisputeManagementPage />} />
          <Route path="coupons" element={<AdminCouponManagementPage />} />
          <Route path="cms" element={<AdminCMSPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/auth" element={<Outlet />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="workshop-register" element={<WorkshopRegisterPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
