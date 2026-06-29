import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { authService } from '../../services/endpoints/authService';

const navLinks = [
  { to: '/', label: 'Trang chủ', exact: true },
  { to: '/workshop-directory', label: 'Xưởng Gia Công', exact: false },
  { to: '/products', label: 'Sản phẩm', exact: false },
  { to: '/create-tender', label: 'Đấu Thầu', exact: false },
  { to: '/my-tenders', label: 'Báo giá của tôi', exact: false, customerOnly: true },
];

const roleLabel: Record<string, string> = {
  customer: 'Khách hàng',
  workshop: 'Đối tác xưởng',
  admin: 'Quản trị viên',
};

const Header = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { totalItems, reset: resetCart } = useCartStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    await authService.logout();
    resetCart();
    navigate('/auth/login');
  };

  // Tạo initials từ tên user khi không có avatar
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : '?';

  return (
    <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant shadow-sm h-20">
      <div className="flex justify-between items-center w-full px-4 md:px-8 h-full max-w-[1400px] mx-auto gap-4">

        {/* ── Logo ── */}
        <div className="flex items-center gap-8 flex-shrink-0">
          <Link to="/" className="font-extrabold text-xl text-primary tracking-tight">
            Bách Xưởng
          </Link>

          {/* Nav — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((link) => !link.customerOnly || user?.role === 'customer')
              .map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to, link.exact)
                    ? 'text-secondary bg-secondary/8 font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Search ── */}
        <div className="flex-1 max-w-sm relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none transition-all"
            placeholder="Tìm xưởng, sản phẩm..."
            type="text"
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated && user ? (
            <>
              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                title="Giỏ hàng"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] text-white font-bold leading-none">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <button
                className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                title="Thông báo"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>

              {/* Avatar + Dropdown */}
              <div className="group relative ml-1">
                {/* Trigger */}
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-container transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0 ring-2 ring-secondary/30">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{initials}</span>
                    )}
                  </div>
                  {/* Name — chỉ hiện trên desktop */}
                  <div className="hidden xl:block text-left">
                    <p className="text-sm font-semibold text-on-surface leading-tight max-w-[120px] truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-on-surface-variant leading-tight">
                      {roleLabel[user.role] ?? user.role}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-sm hidden xl:block">
                    expand_more
                  </span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-outline-variant rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
                  {/* User info */}
                  <div className="flex items-center gap-3 p-4 border-b border-outline-variant bg-surface-container-lowest">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-sm font-bold">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface truncate">{user.name}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                        {roleLabel[user.role] ?? user.role}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <Link
                      to="/orders"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">receipt_long</span>
                      Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/wishlist"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">favorite</span>
                      Danh sách yêu thích
                    </Link>
                    <Link
                      to="/addresses"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>
                      Quản lý địa chỉ
                    </Link>
                    {user.role === 'customer' && (
                      <Link
                        to="/my-tenders"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">request_quote</span>
                        Báo giá của tôi
                      </Link>
                    )}

                    {user.role === 'workshop' && (
                      <Link
                        to="/workshop/dashboard"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">factory</span>
                        Quản lý xưởng
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-surface-container rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">admin_panel_settings</span>
                        Quản trị hệ thống
                      </Link>
                    )}

                    <div className="border-t border-outline-variant my-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/8 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Chưa đăng nhập */
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="btn-user-outline-sm"
              >
                Đăng nhập
              </Link>
              <Link
                to="/auth/register"
                className="btn-user-primary-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
