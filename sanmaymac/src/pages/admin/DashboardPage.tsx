import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AdminOrdersBarChart,
  AdminRevenueLineChart,
  AdminWorkshopPieChart,
} from '../../components/admin/AdminDashboardCharts';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  adminService,
  type AdminDashboardStats,
  type PayoutItem,
} from '../../services/endpoints/adminService';

const buildDefaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 5);
  from.setDate(1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
};

const formatRangeLabel = (from: string, to: string) => {
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${fmt(from)} – ${fmt(to)}`;
};

const STAT_ACCENTS = [
  { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-100' },
  { bg: 'bg-sky-50', icon: 'text-sky-600', ring: 'ring-sky-100' },
  { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
  { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
];

const ChartSkeleton = ({ tall = false, pie = false }: { tall?: boolean; pie?: boolean }) => (
  <div
    className={`animate-pulse rounded-xl bg-slate-100 ${pie ? 'min-h-[480px]' : tall ? 'min-h-[360px]' : 'min-h-[320px]'}`}
  />
);

const ChartCard = ({
  title,
  description,
  accent,
  icon,
  large = false,
  children,
}: {
  title: string;
  description: string;
  accent: string;
  icon: string;
  large?: boolean;
  children: ReactNode;
}) => (
  <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <header className={`flex items-start gap-4 border-b border-slate-100 px-6 py-5 ${accent}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-600">{description}</p>
      </div>
    </header>
    <div className={large ? 'px-6 py-10' : 'p-6'}>{children}</div>
  </article>
);

export const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [workshopCount, setWorkshopCount] = useState(0);
  const [pendingPayoutCount, setPendingPayoutCount] = useState(0);
  const [recentPayouts, setRecentPayouts] = useState<PayoutItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [range] = useState(buildDefaultRange);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, workshopsRes, pendingRes, statsRes] = await Promise.all([
          adminService.searchUsers({ page: 0, size: 1 }),
          adminService.listWorkshopsPublic({ page: 0, size: 1, verifiedOnly: false }),
          adminService.listAdminPayouts('PENDING'),
          adminService.getDashboardStats({ ...range, groupBy: 'month' }),
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
          }).slice(0, 5)
        );
        setDashboardStats(statsRes.data.data ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, [range]);

  const trendItems = dashboardStats?.trend.items ?? [];
  const groupBy = dashboardStats?.trend.groupBy ?? 'month';
  const workshopShares = dashboardStats?.revenueByWorkshop ?? [];

  const totalTrendRevenue = trendItems.reduce((sum, item) => sum + Number(item.totalRevenue), 0);
  const totalTrendOrders = trendItems.reduce((sum, item) => sum + item.totalOrders, 0);
  const avgOrderValue = totalTrendOrders > 0 ? totalTrendRevenue / totalTrendOrders : 0;

  const stats = useMemo(
    () => [
      {
        label: 'Doanh thu 6 tháng',
        value: Math.round(totalTrendRevenue).toLocaleString('vi-VN'),
        unit: '₫',
        icon: 'payments',
      },
      {
        label: 'Tổng đơn hàng',
        value: totalTrendOrders.toLocaleString('vi-VN'),
        unit: 'đơn',
        icon: 'shopping_bag',
      },
      {
        label: 'Xưởng may',
        value: workshopCount.toLocaleString('vi-VN'),
        unit: 'xưởng',
        icon: 'precision_manufacturing',
      },
      {
        label: 'Người dùng',
        value: userCount.toLocaleString('vi-VN'),
        unit: 'tài khoản',
        icon: 'group',
      },
    ],
    [totalTrendOrders, totalTrendRevenue, userCount, workshopCount]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bảng điều khiển</h1>
            <p className="mt-1 text-sm text-slate-500">Tổng quan hoạt động kinh doanh và vận hành nền tảng.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <span className="material-symbols-outlined text-base text-slate-400">calendar_month</span>
            {formatRangeLabel(range.from, range.to)}
          </span>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const accent = STAT_ACCENTS[index % STAT_ACCENTS.length];
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-2.5 ring-4 ${accent.bg} ${accent.ring}`}>
                    <span className={`material-symbols-outlined text-xl ${accent.icon}`}>{stat.icon}</span>
                  </div>
                  {stat.label === 'Tổng đơn hàng' && pendingPayoutCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {pendingPayoutCount} rút tiền chờ
                    </span>
                  )}
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  {loading ? (
                    <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                      <span className="text-sm text-slate-400">{stat.unit}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Phân tích doanh thu</h2>
              <p className="mt-1 text-sm text-slate-500">Dữ liệu từ đơn hàng đã thanh toán trong 6 tháng gần nhất</p>
            </div>
            {!loading && trendItems.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm">
                  <span className="text-slate-400">Giá trị TB/đơn</span>
                  <p className="font-bold text-slate-900">{Math.round(avgOrderValue).toLocaleString('vi-VN')}₫</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm">
                  <span className="text-slate-400">Xưởng có doanh thu</span>
                  <p className="font-bold text-slate-900">{workshopShares.length} xưởng</p>
                </div>
              </div>
            )}
          </div>

          <ChartCard
            title="Doanh thu theo xưởng may"
            description="Biểu đồ tròn — tỷ trọng doanh thu từng xưởng trong kỳ"
            accent="bg-emerald-50"
            icon="pie_chart"
            large
          >
            {loading ? <ChartSkeleton pie /> : <AdminWorkshopPieChart items={workshopShares} />}
          </ChartCard>

          <ChartCard
            title="Xu hướng doanh thu"
            description="Biểu đồ đường — theo dõi doanh thu từng tháng"
            accent="bg-indigo-50"
            icon="show_chart"
          >
            {loading ? <ChartSkeleton tall /> : <AdminRevenueLineChart items={trendItems} groupBy={groupBy} />}
          </ChartCard>

          <ChartCard
            title="Khối lượng đơn hàng"
            description="Biểu đồ cột — số đơn hoàn tất mỗi tháng"
            accent="bg-sky-50"
            icon="bar_chart"
          >
            {loading ? <ChartSkeleton /> : <AdminOrdersBarChart items={trendItems} groupBy={groupBy} />}
          </ChartCard>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Yêu cầu rút tiền chờ duyệt</h3>
                  <p className="text-xs text-slate-500">{pendingPayoutCount} yêu cầu đang chờ xử lý</p>
                </div>
                <Link
                  to="/admin/withdrawals"
                  className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  Xem tất cả →
                </Link>
              </div>

              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="space-y-3 p-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : recentPayouts.length ? (
                  recentPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <span className="material-symbols-outlined text-lg">account_balance</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            Yêu cầu #{payout.id} · Xưởng #{payout.workshopId}
                          </p>
                          <p className="text-xs text-slate-400">
                            {payout.createdAt ? new Date(payout.createdAt).toLocaleString('vi-VN') : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {(payout.amount ?? 0).toLocaleString('vi-VN')}₫
                        </p>
                        <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          {payout.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center text-sm text-slate-400">Không có yêu cầu rút tiền đang chờ.</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Tóm tắt nhanh</h3>
            <p className="mt-1 text-xs text-slate-500">Chỉ số trong kỳ đang xem</p>
            <dl className="mt-5 space-y-4">
              {[
                { label: 'Doanh thu', value: `${Math.round(totalTrendRevenue).toLocaleString('vi-VN')}₫`, icon: 'trending_up' },
                { label: 'Đơn hàng', value: `${totalTrendOrders} đơn`, icon: 'receipt_long' },
                { label: 'Xưởng active', value: `${workshopShares.length} / ${workshopCount}`, icon: 'factory' },
                { label: 'Rút tiền chờ', value: `${pendingPayoutCount} yêu cầu`, icon: 'pending_actions' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="material-symbols-outlined text-base text-slate-400">{item.icon}</span>
                    {item.label}
                  </div>
                  <dd className="text-sm font-semibold text-slate-900">
                    {loading ? <span className="inline-block h-4 w-16 animate-pulse rounded bg-slate-100" /> : item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
