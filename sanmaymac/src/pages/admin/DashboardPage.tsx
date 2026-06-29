import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminService, type PayoutItem } from '../../services/endpoints/adminService';

export const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [workshopCount, setWorkshopCount] = useState(0);
  const [pendingPayoutCount, setPendingPayoutCount] = useState(0);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [recentPayouts, setRecentPayouts] = useState<PayoutItem[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, workshopsRes, pendingRes, cashflowRes] = await Promise.all([
          adminService.searchUsers({ page: 0, size: 1 }),
          adminService.listWorkshopsPublic({ page: 0, size: 1, verifiedOnly: false }),
          adminService.listAdminPayouts('PENDING'),
          adminService.getCashflow(),
        ]);
        setUserCount(usersRes.data.data?.totalElements ?? 0);
        setWorkshopCount(workshopsRes.data.data?.totalElements ?? 0);
        const payouts = pendingRes.data.data ?? [];
        setPendingPayoutCount(payouts.length);
        setRecentPayouts(
          [...payouts].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          }).slice(0, 6)
        );
        setPlatformRevenue(cashflowRes.data.data?.platformRevenue ?? 0);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Doanh thu nền tảng',
        value: platformRevenue.toLocaleString('vi-VN'),
        unit: 'đ',
        icon: 'payments',
      },
      { label: 'Tổng số xưởng may', value: workshopCount.toLocaleString('vi-VN'), unit: 'xưởng', icon: 'precision_manufacturing' },
      { label: 'Tổng người dùng', value: userCount.toLocaleString('vi-VN'), unit: 'tài khoản', icon: 'group' },
      { label: 'Yêu cầu rút tiền chờ duyệt', value: pendingPayoutCount.toLocaleString('vi-VN'), unit: 'yêu cầu', icon: 'account_balance' },
    ],
    [pendingPayoutCount, platformRevenue, userCount, workshopCount]
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header>
          <h1 className="font-headline-md text-slate-900 text-3xl">Bảng điều khiển hệ thống</h1>
          <p className="text-slate-500 font-body-md mt-1">Quản lý toàn bộ hoạt động kinh doanh và vận hành của Bách Xưởng.</p>
        </header>

        {/* STATS GRID */}
        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                  <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900">{s.value}</span>
                <span className="text-sm text-slate-500 font-medium">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* RECENT ACTIVITIES */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-headline-sm text-slate-900">Yêu cầu rút tiền mới</h3>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
                ) : recentPayouts.length ? (
                  recentPayouts.map((payout) => (
                    <div key={payout.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
                        <span className="material-symbols-outlined">account_balance</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Yêu cầu #{payout.id} - xưởng #{payout.workshopId}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Số tiền: {(payout.amount ?? 0).toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        {payout.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {payout.createdAt ? new Date(payout.createdAt).toLocaleString('vi-VN') : '-'}
                      </p>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="p-6 text-sm text-slate-500">Không có yêu cầu rút tiền đang chờ.</div>
                )}
              </div>
            </div>
          </div>

          {/* SYSTEM HEALTH */}
          <div className="space-y-4">
            <h3 className="font-headline-sm text-slate-900 px-2">Tình trạng hệ thống</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
              {[
                { name: 'API Server', status: '99.9%', color: 'text-green-600' },
                { name: 'Database', status: 'Stable', color: 'text-green-600' },
                { name: 'Payment Gateway', status: 'Latency', color: 'text-amber-600' },
                { name: 'Storage', status: '85% used', color: 'text-slate-900' },
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <span className="text-sm font-medium text-slate-600">{s.name}</span>
                  <span className={`text-sm font-bold ${s.color}`}>{s.status}</span>
                </div>
              ))}
              <div className="pt-2">
                <div className="p-4 bg-slate-900 rounded-xl text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Phiên bản hiện tại</p>
                  <p className="text-sm font-bold flex justify-between items-center">
                    v2.4.12 - Enterprise
                    <span className="material-symbols-outlined text-sm opacity-60">info</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
