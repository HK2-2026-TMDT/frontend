import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import {
  enrichWorkshopOrders,
  workshopService,
  type WorkshopOrder,
} from '../../services/endpoints/workshopService';
import {
  formatWorkshopCurrency,
  formatWorkshopDate,
  getOrderStatusClass,
  getOrderStatusLabel,
  getOrderTypeLabel,
} from '../../utils/workshopUi';

type OrderTypeFilter = '' | 'READY_MADE' | 'CUSTOM';

interface WorkshopOrderManagementPageProps {
  defaultOrderType?: OrderTypeFilter;
  title?: string;
  description?: string;
}

export const WorkshopOrderManagementPage = ({
  defaultOrderType = '',
  title = 'Quản lý đơn hàng',
  description = 'Theo dõi, duyệt và cập nhật tiến độ sản xuất.',
}: WorkshopOrderManagementPageProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tat-ca');
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>(defaultOrderType);
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'tat-ca', label: 'Tất cả', status: undefined },
    { id: 'cho-duyet', label: 'Chờ duyệt', status: 'PENDING' },
    { id: 'dang-san-xuat', label: 'Đang sản xuất', status: 'PRODUCING' },
    { id: 'da-hoan-thanh', label: 'Đã giao', status: 'SHIPPED' },
  ];

  const activeStatus = tabs.find((tab) => tab.id === activeTab)?.status;

  useEffect(() => {
    setOrderTypeFilter(defaultOrderType);
  }, [defaultOrderType]);

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await workshopService.getWorkshopOrders({
          page: 0,
          size: 50,
          sort: 'createdAt,desc',
          status: activeStatus,
          orderType: orderTypeFilter || undefined,
        });

        if (mounted) {
          const raw = response.data.data?.content ?? [];
          setOrders(await enrichWorkshopOrders(raw));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách đơn hàng.');
          setOrders([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, [activeStatus, orderTypeFilter]);

  const refreshOrders = async () => {
    const response = await workshopService.getWorkshopOrders({
      page: 0,
      size: 50,
      sort: 'createdAt,desc',
      status: activeStatus,
      orderType: orderTypeFilter || undefined,
    });
    const raw = response.data.data?.content ?? [];
    setOrders(await enrichWorkshopOrders(raw));
  };

  const updateOrder = async (
    orderId: number,
    action: 'accept' | 'reject' | 'producing' | 'shipped',
    confirmMessage?: string,
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setSavingOrderId(orderId);
    setError(null);

    try {
      if (action === 'accept') {
        await workshopService.acceptWorkshopOrder(orderId);
      } else if (action === 'reject') {
        await workshopService.rejectWorkshopOrder(orderId);
      } else if (action === 'producing') {
        await workshopService.updateWorkshopOrderStatus(orderId, 'PRODUCING');
      } else {
        await workshopService.updateWorkshopOrderStatus(orderId, 'SHIPPED');
      }
      await refreshOrders();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái đơn hàng.');
    } finally {
      setSavingOrderId(null);
    }
  };

  const typeTabs: { id: OrderTypeFilter; label: string }[] = defaultOrderType
    ? []
    : [
        { id: '', label: 'Tất cả loại' },
        { id: 'READY_MADE', label: 'Mẫu sẵn' },
        { id: 'CUSTOM', label: 'Gia công' },
      ];

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <WorkshopPageHeader title={title} description={description} />

        {error ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        {typeTabs.length ? (
          <div className="flex flex-wrap gap-2">
            {typeTabs.map((tab) => (
              <button
                key={tab.id || 'all-types'}
                type="button"
                onClick={() => setOrderTypeFilter(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  orderTypeFilter === tab.id
                    ? 'bg-secondary/10 text-secondary'
                    : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="inline-flex gap-1 rounded-2xl border border-outline-variant bg-surface-container-low p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-on-surface-variant">Đang tải đơn hàng…</div>
          ) : orders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Mã đơn</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Loại</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Sản phẩm</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Khách</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Ngày đặt</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Trạng thái</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-on-surface-variant">
                      Giá trị
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="group cursor-pointer transition-all hover:bg-surface-container"
                      onClick={() => navigate(`/workshop/production/${order.id}`)}
                    >
                      <td className="px-6 py-5">
                        <span className="font-mono text-sm font-bold text-secondary">
                          {order.orderCode ?? `DH-${order.id}`}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                          {getOrderTypeLabel(order.orderType)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-on-surface">{order.productName ?? 'Đơn hàng'}</p>
                        <p className="text-xs text-on-surface-variant">SL: {order.quantity ?? 0}</p>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{order.customerName ?? '—'}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">
                        {formatWorkshopDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClass(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-on-surface">
                        {formatWorkshopCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void updateOrder(order.id, 'accept')}
                                disabled={savingOrderId === order.id}
                                className="rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                              >
                                Nhận đơn
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void updateOrder(order.id, 'reject', 'Từ chối đơn hàng này?')
                                }
                                disabled={savingOrderId === order.id}
                                className="rounded-lg border border-error px-3 py-2 text-xs font-bold text-error disabled:opacity-50"
                              >
                                Từ chối
                              </button>
                            </>
                          ) : null}
                          {order.status === 'DEPOSITED' ? (
                            <button
                              type="button"
                              onClick={() => void updateOrder(order.id, 'producing')}
                              disabled={savingOrderId === order.id}
                              className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                            >
                              Sản xuất
                            </button>
                          ) : null}
                          {order.status === 'PRODUCING' ? (
                            <button
                              type="button"
                              onClick={() => void updateOrder(order.id, 'shipped')}
                              disabled={savingOrderId === order.id}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                            >
                              Đã giao
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => navigate(`/workshop/production/${order.id}`)}
                            className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold text-on-surface hover:border-secondary"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-on-surface-variant">
              Không có đơn hàng trong bộ lọc này.
            </div>
          )}
        </div>
      </div>
    </WorkshopLayout>
  );
};
