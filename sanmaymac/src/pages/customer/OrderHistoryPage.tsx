import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { orderService, type OrderSummary } from '../../services/endpoints/orderService';

const statusTabs = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã tiếp nhận', value: 'DEPOSITED' },
  { label: 'Đang sản xuất', value: 'PRODUCING' },
  { label: 'Đang giao', value: 'SHIPPED' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const statusToText: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  DEPOSITED: 'Đã tiếp nhận',
  PRODUCING: 'Đang sản xuất',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusToColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  DEPOSITED: 'bg-blue-100 text-blue-700',
  PRODUCING: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-cyan-100 text-cyan-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const OrderHistoryPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { checkoutMessage?: string } | null)?.checkoutMessage ?? null,
  );
  const [searchParams] = useSearchParams();

  const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

  const reloadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getMyOrders({ page: 0, size: 50, sort: 'createdAt,desc' });
      setOrders(response.data.data?.content ?? []);
    } catch {
      setError('Không thể tải đơn hàng. Vui lòng thử lại.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!window.confirm('Hủy đơn hàng này?')) return;
    setCancellingId(orderId);
    setError(null);
    try {
      await orderService.cancelOrder(orderId);
      setSuccessMessage('Đã hủy đơn hàng thành công.');
      await reloadOrders();
    } catch {
      setError('Không thể hủy đơn hàng.');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setSearch(highlightId);
    }
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await orderService.getMyOrders({ page: 0, size: 50, sort: 'createdAt,desc' });
        if (mounted) {
          setOrders(response.data.data?.content ?? []);
        }
      } catch {
        if (mounted) {
          setError('Không thể tải đơn hàng. Vui lòng thử lại.');
          setOrders([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void loadOrders();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const matchTab = !activeTab || o.status === activeTab;
        const term = search.toLowerCase();
        const matchSearch =
          !term ||
          String(o.id).includes(term) ||
          statusToText[o.status]?.toLowerCase().includes(term) ||
          o.orderType?.toLowerCase().includes(term);
        return matchTab && matchSearch;
      }),
    [orders, activeTab, search]
  );

  return (
    <CustomerLayout>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline-lg text-on-surface">Quản lý Đơn hàng</h1>
            <p className="text-on-surface-variant font-body-md mt-1">Theo dõi và quản lý tất cả đơn hàng của bạn</p>
          </div>
          <Link to="/create-tender" className="btn-user-primary-md">
            <span className="material-symbols-outlined">add</span>
            Đặt hàng mới
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
            placeholder="Tìm kiếm theo mã đơn hàng, tên xưởng..."
          />
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto mb-8 pb-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value || 'all'}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2 rounded-full font-label-sm whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? 'btn-user-chip-active'
                  : 'btn-user-chip'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Order Cards */}
        <div className="space-y-6">
          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
          {loading ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
              Đang tải danh sách đơn hàng...
            </div>
          ) : (
            <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest border border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">inbox</span>
              <p className="font-headline-md text-on-surface mb-2">Không tìm thấy đơn hàng</p>
              <p className="text-on-surface-variant">Hãy thử tìm kiếm với từ khóa khác.</p>
            </div>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-5 border-b border-outline-variant bg-surface-container-low">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-bold text-on-surface font-label-sm">#DH-{order.id}</span>
                      <span className="text-on-surface-variant text-xs ml-3">
                        Ngày đặt: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '--'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusToColor[order.status] ?? 'bg-surface-container text-on-surface-variant'}`}>
                      {statusToText[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant capitalize">
                    <span className="material-symbols-outlined text-sm">category</span>
                    {order.orderType?.replace('_', ' ').toLowerCase() ?? 'Đơn hàng'}
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-on-surface-variant">
                        Theo dõi chi tiết tiến độ, thanh toán và vận chuyển của đơn hàng tại trang chi tiết.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant mb-1">Tổng giá trị</p>
                      <p className="font-extrabold text-secondary text-lg">{fmt(order.totalAmount ?? 0)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-outline-variant">
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn-user-outline-sm"
                    >
                      Xem chi tiết
                    </Link>
                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={cancellingId === order.id}
                        onClick={() => void handleCancel(order.id)}
                        className="px-4 py-2 border border-error text-error rounded-lg text-sm font-medium hover:bg-error/5 disabled:opacity-50 transition-colors"
                      >
                        {cancellingId === order.id ? 'Đang hủy…' : 'Hủy đơn'}
                      </button>
                    )}
                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <Link
                        to={order.checkoutBatchId ? `/payment/batch/${order.checkoutBatchId}` : `/orders/${order.id}/payment`}
                        className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container transition-colors"
                      >
                        Thanh toán
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
            </>
          )}
        </div>
      </main>
    </CustomerLayout>
  );
};
