import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/endpoints/authService';
import { workshopService, type WorkshopProfile } from '../../services/endpoints/workshopService';

const getInitials = (value?: string) => {
  if (!value) return 'XX';
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

type WorkshopMenuLink = {
  type: 'link';
  label: string;
  icon: string;
  path: string;
};

type WorkshopMenuGroup = {
  type: 'group';
  label: string;
  icon: string;
  children: Array<{ label: string; path: string }>;
};

type WorkshopMenuItem = WorkshopMenuLink | WorkshopMenuGroup;

const ORDER_MENU_PATHS = [
  '/workshop/ready-made-orders',
  '/workshop/production-management',
  '/workshop/production',
] as const;

const isOrderMenuPath = (pathname: string) =>
  ORDER_MENU_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const WORKSHOP_MENU_ITEMS: WorkshopMenuItem[] = [
  { type: 'link', label: 'Tổng quan', icon: 'dashboard', path: '/workshop/dashboard' },
  { type: 'link', label: 'Sản phẩm', icon: 'inventory_2', path: '/workshop/products' },
  {
    type: 'group',
    label: 'Đơn hàng',
    icon: 'receipt_long',
    children: [
      { label: 'Mẫu sẵn', path: '/workshop/ready-made-orders' },
      { label: 'Gia công', path: '/workshop/production-management' },
    ],
  },
  { type: 'link', label: 'Yêu cầu gia công', icon: 'storefront', path: '/workshop/marketplace' },
  { type: 'link', label: 'Báo giá', icon: 'request_quote', path: '/workshop/quotes' },
  { type: 'link', label: 'Đánh giá', icon: 'reviews', path: '/workshop/reviews' },
  { type: 'link', label: 'Tin nhắn', icon: 'chat', path: '/workshop/messages' },
  { type: 'link', label: 'Tài chính', icon: 'account_balance_wallet', path: '/workshop/finance' },
  { type: 'link', label: 'Thiết lập xưởng', icon: 'settings_applications', path: '/workshop/settings' },
];

export const WorkshopLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<WorkshopProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(() => isOrderMenuPath(location.pathname));

  useEffect(() => {
    if (isOrderMenuPath(location.pathname)) {
      setOrdersMenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingProfile(true);
      try {
        const [profileRes, unreadRes] = await Promise.allSettled([
          workshopService.getWorkshopProfile(),
          workshopService.getWorkshopUnreadNotificationCount(),
        ]);
        if (!mounted) return;
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.data ?? null);
        if (unreadRes.status === 'fulfilled') setUnreadNotifications(unreadRes.value.data.data ?? 0);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const displayName = profile?.shopName || profile?.fullName || 'Xưởng may';
  const avatarText = useMemo(() => getInitials(profile?.shopName || profile?.fullName), [profile?.shopName, profile?.fullName]);

  const currentPageLabel = useMemo(() => {
    for (const item of WORKSHOP_MENU_ITEMS) {
      if (item.type === 'link') {
        if (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) {
          return item.label;
        }
        continue;
      }

      const child = [...item.children]
        .sort((a, b) => b.path.length - a.path.length)
        .find((entry) => location.pathname === entry.path || location.pathname.startsWith(`${entry.path}/`));
      if (child) return child.label;

      if (isOrderMenuPath(location.pathname)) return 'Đơn hàng';
    }

    return 'Bách Xưởng';
  }, [location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/workshop/dashboard' && location.pathname.startsWith(path));

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      navigate('/auth/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <aside className="sticky top-0 flex h-screen w-64 flex-col bg-primary text-white">
        <div className="border-b border-white/10 p-6">
          <Link to="/workshop/dashboard" className="text-xl font-bold tracking-tight">
            Bách Xưởng
          </Link>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-white/60">Portal đối tác</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {WORKSHOP_MENU_ITEMS.map((item) => {
            if (item.type === 'link') {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive(item.path)
                      ? 'bg-secondary text-white shadow-md'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            }

            const groupActive = isOrderMenuPath(location.pathname);

            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setOrdersMenuOpen((open) => !open)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    groupActive
                      ? 'bg-secondary/20 text-white'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <span
                    className={`material-symbols-outlined text-lg transition-transform ${
                      ordersMenuOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {ordersMenuOpen ? (
                  <div className="ml-4 space-y-1 border-l border-white/15 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ${
                          isActive(child.path)
                            ? 'bg-secondary font-semibold text-white shadow-md'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base opacity-80">subdirectory_arrow_right</span>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            {loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6 md:px-8">
          <h2 className="text-sm font-semibold text-on-surface">{currentPageLabel}</h2>

          <div className="flex items-center gap-3">
            <Link
              to="/workshop/messages"
              className="relative rounded-full p-2 transition-colors hover:bg-surface-container"
              title="Tin nhắn"
            >
              <span className="material-symbols-outlined text-on-surface-variant">chat</span>
            </Link>
            <button
              type="button"
              className="relative rounded-full p-2 transition-colors hover:bg-surface-container"
              title="Thông báo"
            >
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              {unreadNotifications > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              ) : null}
            </button>
            <Link
              to="/workshop/settings"
              className="hidden items-center sm:flex"
              title={displayName}
            >
              {profile?.logoUrl || profile?.avatarUrl ? (
                <img
                  src={profile.logoUrl ?? profile.avatarUrl}
                  alt={displayName}
                  className="h-9 w-9 rounded-full border border-outline-variant object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-xs font-bold text-secondary">
                  {loadingProfile ? '…' : avatarText}
                </div>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
};
