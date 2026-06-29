import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/endpoints/authService';

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems = [
    { label: 'Bảng điều khiển', icon: 'dashboard', path: '/admin/dashboard' },
    { label: 'Kiểm duyệt Xưởng', icon: 'verified_user', path: '/admin/audit' },
    { label: 'Kiểm duyệt Sản phẩm', icon: 'inventory_2', path: '/admin/products' },
    { label: 'Quản lý Người dùng', icon: 'group', path: '/admin/users' },
    { label: 'Mã giảm giá', icon: 'local_offer', path: '/admin/coupons' },
    { label: 'Yêu cầu rút tiền', icon: 'payments', path: '/admin/withdrawals' },
    { label: 'Quản trị Nội dung', icon: 'article', path: '/admin/cms' },
    { label: 'Cấu hình hệ thống', icon: 'settings', path: '/admin/settings' },
  ];

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
    <div className="flex min-h-screen bg-background">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-secondary-container">Bách Xưởng</Link>
          <p className="text-[10px] text-slate-400 uppercase mt-1">Super Admin Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                location.pathname === item.path
                  ? 'bg-primary text-white shadow-md border-l-4 border-secondary'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-label-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex w-full items-center gap-4 px-4 py-2 text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-sm">{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-outline-variant sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-slate-500">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm xưởng, đơn hàng, mã giao dịch..." 
              className="bg-transparent border-none outline-none text-sm w-80"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase">System Healthy</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">Admin Manager</p>
                <p className="text-[10px] text-slate-500 uppercase">Super User</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtmv82IrPxVAAX5KcBAbIMuBWZkrRFmiIGGXd-Dn3FFK-jrO8MY3ReyUX_Gim8MqvVjccJeGCMQ1qsbFcdSojZk3FSMYoM4VQUW8BtlA4Pyy2Exg8139tG8qlaOdL40UV4Lh2DICCZncTpMLCx_7wuNJhwCUSKRxB5jRMTc5HJ6URik2St9Jwj3EeDC7Ucx_hsOlfQcVL0x_QKFACosQm-m5aggOiA-FLg_yq0c2cMvJ-fmtZSXocP-iBWl3PhijbP7EKoTEQ8ha8" alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
