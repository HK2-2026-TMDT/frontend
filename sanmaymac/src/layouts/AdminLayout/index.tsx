import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/endpoints/authService';
import { useAuthStore } from '../../store/useAuthStore';

const getInitials = (value?: string) => {
  if (!value) return 'AD';
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

const formatRole = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'Super Admin';
    case 'workshop':
      return 'Xưởng may';
    case 'customer':
      return 'Khách hàng';
    default:
      return role ?? '—';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const menuItems = [
    { label: 'Bảng điều khiển', icon: 'dashboard', path: '/admin/dashboard' },
    { label: 'Kiểm duyệt Xưởng', icon: 'verified_user', path: '/admin/audit' },
    { label: 'Kiểm duyệt Sản phẩm', icon: 'inventory_2', path: '/admin/products' },
    { label: 'Quản lý Người dùng', icon: 'group', path: '/admin/users' },
    { label: 'Mã giảm giá', icon: 'local_offer', path: '/admin/coupons' },
    { label: 'Yêu cầu rút tiền', icon: 'payments', path: '/admin/withdrawals' },
    { label: 'Khiếu nại', icon: 'report', path: '/admin/complaints' },
    { label: 'Tranh chấp', icon: 'gavel', path: '/admin/disputes' },
    { label: 'Tin nhắn', icon: 'chat', path: '/admin/messages' },
    { label: 'Quản trị Nội dung', icon: 'article', path: '/admin/cms' },
    { label: 'Cấu hình hệ thống', icon: 'settings', path: '/admin/settings' },
  ];

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await authService.getCurrentUser();
        const profile = response.data.data;
        if (!mounted || !profile) return;
        setUser({
          ...profile,
          role: (profile.role?.toLowerCase() ?? 'admin') as typeof profile.role,
        });
      } catch {
        // Giữ thông tin từ auth store nếu không tải được /me
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [setUser]);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';
  const avatarText = useMemo(() => getInitials(user?.name || user?.email), [user?.name, user?.email]);
  const roleLabel = formatRole(user?.role);

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
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-slate-900 text-white">
        <div className="border-b border-white/5 px-6 py-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-white">
            Bách Xưởng
          </Link>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-slate-500">Admin Portal</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  active
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-indigo-300' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
            aria-expanded={profileOpen}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white ring-2 ring-white/10">
                {loadingProfile ? '…' : avatarText}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{roleLabel}</p>
            </div>
            <span className="material-symbols-outlined text-lg text-slate-400">
              {profileOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {profileOpen && (
            <div className="mt-2 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-indigo-300">admin_panel_settings</span>
                <p className="font-semibold text-white">Thông tin tài khoản</p>
              </div>
              <dl className="space-y-2.5 text-slate-300">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">Họ tên</dt>
                  <dd className="mt-0.5 font-medium text-white">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">Email</dt>
                  <dd className="mt-0.5 break-all font-medium text-white">{user?.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">Vai trò</dt>
                  <dd className="mt-0.5 font-medium text-white">{roleLabel}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">Mã người dùng</dt>
                  <dd className="mt-0.5 font-medium text-white">#{user?.id ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-slate-500">Ngày tham gia</dt>
                  <dd className="mt-0.5 font-medium text-white">{formatDate(user?.createdAt)}</dd>
                </div>
              </dl>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Hệ thống ổn định
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-sm">
          <div className="flex w-full items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-lg">search</span>
            <input
              type="text"
              placeholder="Tìm xưởng, đơn hàng, mã giao dịch..."
              className="w-full max-w-xl border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
