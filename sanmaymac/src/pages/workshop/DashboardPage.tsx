import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import {
  enrichWorkshopOrders,
  workshopService,
  type WorkshopDashboardSummary,
  type WorkshopOrder,
} from '../../services/endpoints/workshopService';
import {
  formatWorkshopCurrency,
  formatWorkshopDate,
  getOrderProgressPercent,
  getOrderStatusClass,
  getOrderStatusLabel,
} from '../../utils/workshopUi';

export const WorkshopDashboardPage = () => {
  const [summary, setSummary] = useState<WorkshopDashboardSummary | null>(null);
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, ordersRes] = await Promise.all([
          workshopService.getWorkshopDashboardSummary(),
          workshopService.getWorkshopOrders({ page: 0, size: 5, sort: 'createdAt,desc' }),
        ]);

        if (!mounted) return;

        setSummary(summaryRes.data.data ?? null);
        const rawOrders = ordersRes.data.data?.content ?? [];
        setOrders(await enrichWorkshopOrders(rawOrders));
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Số dư khả dụng',
        value: formatWorkshopCurrency(summary?.walletBalance),
        icon: 'account_balance_wallet',
        tone: 'text-secondary',
      },
      {
        label: 'Doanh thu',
        value: formatWorkshopCurrency(summary?.revenueTotal),
        icon: 'trending_up',
        tone: 'text-green-600',
      },
      {
        label: 'Tổng đơn hàng',
        value: String(summary?.totalOrders ?? 0),
        icon: 'shopping_bag',
        tone: 'text-on-surface',
      },
      {
        label: 'Chờ xử lý',
        value: String(summary?.pendingOrders ?? 0),
        icon: 'pending_actions',
        tone: 'text-amber-600',
      },
    ],
    [summary],
  );

  return (
    <WorkshopLayout>
      <div className="space-y-8">
        <WorkshopPageHeader
          title="Tổng quan"
          description={
            summary?.ratingAvg
              ? `Đánh giá ${summary.ratingAvg.toFixed(1)}/5 · ${summary.reviewCount ?? 0} nhận xét`
              : 'Theo dõi đơn hàng, doanh thu và số dư ví xưởng.'
          }
          actions={
            <>
              <Link
                to="/workshop/finance"
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">payments</span>
                Tài chính
              </Link>
              <Link
                to="/workshop/production"
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <span className="material-symbols-outlined text-base">precision_manufacturing</span>
                Quản lý sản xuất
              </Link>
            </>
          }
        />

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-surface-container p-3 text-secondary">
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{stat.label}</p>
              <p className={`mt-2 text-2xl font-bold ${stat.tone}`}>{loading ? '…' : stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-on-surface">Đơn hàng gần đây</h3>
              <Link to="/workshop/production" className="text-sm font-semibold text-secondary hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-sm">
              {loading ? (
                <div className="p-10 text-center text-sm text-on-surface-variant">Đang tải đơn hàng…</div>
              ) : orders.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="border-b border-outline-variant bg-surface-container-low">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase text-on-surface-variant">Mã đơn</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase text-on-surface-variant">Sản phẩm</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase text-on-surface-variant">Ngày đặt</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase text-on-surface-variant">Trạng thái</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-on-surface-variant">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-container-low/60">
                          <td className="px-5 py-4 text-sm font-bold text-secondary">{order.orderCode}</td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-on-surface">{order.productName}</p>
                            <p className="text-xs text-on-surface-variant">SL: {order.quantity ?? 0}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-on-surface-variant">{formatWorkshopDate(order.createdAt)}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusClass(order.status)}`}>
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-on-surface">
                            {formatWorkshopCurrency(order.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-on-surface-variant">Chưa có đơn hàng nào.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="px-1 text-lg font-bold text-on-surface">Tiến độ sản xuất</h3>
            <div className="space-y-4 rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
              {loading ? (
                <p className="text-sm text-on-surface-variant">Đang tải…</p>
              ) : orders.length ? (
                orders.slice(0, 4).map((order) => {
                  const progress = getOrderProgressPercent(order.status);
                  return (
                    <div key={order.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-on-surface">{order.orderCode}</span>
                        <span className="text-on-surface-variant">{getOrderStatusLabel(order.status)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-on-surface-variant">{order.productName}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-on-surface-variant">Chưa có đơn đang sản xuất.</p>
              )}

              {!loading && summary ? (
                <div className="rounded-xl bg-surface-container-low p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Ví xưởng</p>
                  <p className="mt-1 font-bold text-on-surface">{formatWorkshopCurrency(summary.pendingBalance)} đang chờ</p>
                  {summary.pendingPayouts ? (
                    <p className="mt-1 text-xs text-on-surface-variant">{summary.pendingPayouts} yêu cầu rút tiền</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </WorkshopLayout>
  );
};
