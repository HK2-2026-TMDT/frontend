import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { orderService, type OrderDetail, type OrderTimeline } from '../../services/endpoints/orderService';
import { ApiResponse } from '../../types';

interface Address {
  id: number;
  receiverName: string;
  phone: string;
  detailedAddress: string;
  isDefault: boolean;
}

const statusToText: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  DEPOSITED: 'Đã tiếp nhận',
  PRODUCING: 'Đang sản xuất',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = Number(id);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [timeline, setTimeline] = useState<OrderTimeline | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [detailRes, timelineRes, addrRes] = await Promise.all([
        orderService.getMyOrderDetail(orderId),
        orderService.getMyOrderTimeline(orderId),
        api.get<ApiResponse<Address[]>>('/users/me/addresses'),
      ]);
      const detail = detailRes.data.data;
      setOrder(detail);
      setTimeline(timelineRes.data.data);
      const addrList = addrRes.data.data ?? [];
      setAddresses(addrList);
      setSelectedAddressId(detail?.addressId ?? null);
    } catch {
      setError('Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [orderId]);

  const handleUpdateAddress = async () => {
    if (!order || !selectedAddressId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await orderService.updateMyOrderAddress(order.id, selectedAddressId);
      setOrder(res.data.data);
    } catch {
      setError('Không thể cập nhật địa chỉ cho đơn hàng.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      const res = await orderService.cancelOrder(order.id);
      setOrder(res.data.data);
      await loadData();
    } catch {
      setError('Không thể hủy đơn hàng.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      const res = await orderService.confirmDelivery(order.id);
      setOrder(res.data.data);
      await loadData();
    } catch {
      setError('Không thể xác nhận đã nhận hàng.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerLayout>
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/orders" className="text-on-surface-variant hover:text-secondary">Đơn hàng</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-secondary font-medium">Chi tiết #{orderId}</span>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        {loading || !order ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
            Đang tải chi tiết đơn hàng...
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-on-surface">Đơn hàng #DH-{order.id}</h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Trạng thái: <span className="font-semibold">{statusToText[order.status] ?? order.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant">Tổng tiền</p>
                  <p className="text-2xl font-extrabold text-secondary">{fmt(order.totalAmount ?? 0)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
              <h2 className="font-bold text-on-surface">Địa chỉ nhận hàng</h2>
              <select
                value={selectedAddressId ?? ''}
                onChange={(event) => setSelectedAddressId(Number(event.target.value))}
                disabled={order.status !== 'PENDING'}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-surface text-sm disabled:opacity-60"
              >
                <option value="" disabled>Chọn địa chỉ</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.receiverName} - {addr.phone} - {addr.detailedAddress}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  disabled={saving || order.status !== 'PENDING' || !selectedAddressId}
                  onClick={() => void handleUpdateAddress()}
                  className="btn-user-outline-sm disabled:opacity-50"
                >
                  Cập nhật địa chỉ
                </button>
                <button
                  onClick={() => navigate(
                    order.checkoutBatchId
                      ? `/payment/batch/${order.checkoutBatchId}`
                      : `/orders/${order.id}/payment`,
                  )}
                  className="btn-user-primary-sm"
                >
                  Thanh toán
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-3">
              <h2 className="font-bold text-on-surface">Sản phẩm</h2>
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between border-b border-outline-variant pb-3">
                  <div>
                    <p className="font-medium text-on-surface">{item.productName}</p>
                    <p className="text-xs text-on-surface-variant">SL: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-on-surface">{fmt(item.totalPrice ?? 0)}</p>
                </div>
              ))}
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-3">
              <h2 className="font-bold text-on-surface">Tiến độ đơn hàng</h2>
              {timeline?.items?.map((step) => (
                <div key={step.code} className="flex items-start gap-3">
                  <span className={`material-symbols-outlined mt-0.5 ${step.completed ? 'text-green-600' : 'text-outline'}`}>
                    {step.completed ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <div>
                    <p className="font-medium text-on-surface">{step.label}</p>
                    <p className="text-xs text-on-surface-variant">{step.note}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="flex flex-wrap gap-3">
              {order.status === 'PENDING' && (
                <button
                  disabled={saving}
                  onClick={() => void handleCancel()}
                  className="px-4 py-2 border border-error text-error rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Hủy đơn hàng
                </button>
              )}
              {order.status === 'SHIPPED' && (
                <button
                  disabled={saving}
                  onClick={() => void handleConfirmDelivery()}
                  className="btn-user-primary-sm disabled:opacity-50"
                >
                  Xác nhận đã nhận hàng
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </CustomerLayout>
  );
};
