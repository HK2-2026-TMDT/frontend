import { useEffect, useState } from 'react';
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
} from '../../utils/workshopUi';

export const WorkshopOrderManagementPage = () => {
  const [activeTab, setActiveTab] = useState('tat-ca');
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'tat-ca', label: 'Tất cả', status: undefined },
    { id: 'cho-duyet', label: 'Chờ duyệt', status: 'PENDING' },
    { id: 'dang-san-xuat', label: 'Đang sản xuất', status: 'PRODUCING' },
    { id: 'da-hoan thanh', label: 'Đã hoàn thành', status: 'SHIPPED' },
  ];

  const activeStatus = tabs.find((tab) => tab.id === activeTab)?.status;

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
  }, [activeStatus]);

  const [tabCounts, setTabCounts] = useState({ all: 0, pending: 0, producing: 0, shipped: 0 });

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      try {
        const [allRes, pendingRes, producingRes, shippedRes] = await Promise.all([
          workshopService.getWorkshopOrders({ page: 0, size: 1 }),
          workshopService.getWorkshopOrders({ page: 0, size: 1, status: 'PENDING' }),
          workshopService.getWorkshopOrders({ page: 0, size: 1, status: 'PRODUCING' }),
          workshopService.getWorkshopOrders({ page: 0, size: 1, status: 'SHIPPED' }),
        ]);
        if (!mounted) return;
        setTabCounts({
          all: allRes.data.data?.totalElements ?? 0,
          pending: pendingRes.data.data?.totalElements ?? 0,
          producing: producingRes.data.data?.totalElements ?? 0,
          shipped: shippedRes.data.data?.totalElements ?? 0,
        });
      } catch {
        if (mounted) setTabCounts({ all: 0, pending: 0, producing: 0, shipped: 0 });
      }
    };
    void loadCounts();
    return () => {
      mounted = false;
    };
  }, [activeStatus, orders.length]);

  const refreshOrders = async () => {
    const response = await workshopService.getWorkshopOrders({
      page: 0,
      size: 50,
      sort: 'createdAt,desc',
      status: activeStatus,
    });

    const raw = response.data.data?.content ?? [];
    setOrders(await enrichWorkshopOrders(raw));
  };

  const updateOrder = async (orderId: number, action: 'accept' | 'reject' | 'producing' | 'shipped') => {
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

  const withCounts = tabs.map((tab) => ({
    ...tab,
    count:
      tab.id === 'tat-ca' ? tabCounts.all :
      tab.id === 'cho-duyet' ? tabCounts.pending :
      tab.id === 'dang-san-xuat' ? tabCounts.producing :
      tabCounts.shipped,
  }));

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <WorkshopPageHeader
          title="Quản lý đơn hàng"
          description="Theo dõi, duyệt và cập nhật tiến độ sản xuất."
        />

        {error && (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-2xl border border-outline-variant inline-flex">
          {withCounts.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'px-6 py-2.5 rounded-xl font-label-sm transition-all flex items-center gap-2 ' + 
                (activeTab === tab.id ? 'bg-secondary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5')}
            >
              {tab.label}
              <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant')}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ORDERS TABLE */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
                <div className="p-8 text-center text-sm text-on-surface-variant">Đang tải đơn hàng...</div>
          ) : orders.length ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Mã đơn</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Sản phẩm</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">Ngày đặt</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Giá trị</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container transition-all group cursor-pointer">
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-bold text-secondary">{order.orderCode ?? `DH-${order.id}`}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-on-surface">{order.productName ?? 'Đơn hàng'}</p>
                      <p className="text-xs text-on-surface-variant">SL: {order.quantity ?? 0}</p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">{formatWorkshopDate(order.createdAt)}</td>
                    <td className="px-6 py-5">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClass(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-sm font-bold text-on-surface">{formatWorkshopCurrency(order.totalAmount)}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateOrder(order.id, 'accept')}
                              disabled={savingOrderId === order.id}
                              className="px-3 py-2 rounded-lg bg-secondary text-white text-xs font-bold disabled:opacity-50"
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => updateOrder(order.id, 'reject')}
                              disabled={savingOrderId === order.id}
                              className="px-3 py-2 rounded-lg border border-error text-error text-xs font-bold disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {order.status === 'DEPOSITED' && (
                          <button
                            type="button"
                            onClick={() => updateOrder(order.id, 'producing')}
                            disabled={savingOrderId === order.id}
                            className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
                          >
                            Sang sản xuất
                          </button>
                        )}
                        {order.status === 'PRODUCING' && (
                          <button
                            type="button"
                            onClick={() => updateOrder(order.id, 'shipped')}
                            disabled={savingOrderId === order.id}
                            className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            Đã giao hàng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-sm text-on-surface-variant">Không có đơn hàng trong trạng thái này.</div>
          )}
        </div>
      </div>
    </WorkshopLayout>
  );
};
