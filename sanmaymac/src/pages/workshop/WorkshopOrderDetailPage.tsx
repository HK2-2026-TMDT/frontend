import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import {
  workshopService,
  type WorkshopOrderDetail,
  type WorkshopOrderTimeline,
} from '../../services/endpoints/workshopService';
import {
  formatWorkshopCurrency,
  formatWorkshopDate,
  getOrderStatusClass,
  getOrderStatusLabel,
  getOrderTypeLabel,
} from '../../utils/workshopUi';
import { printWorkshopOrderInvoice } from '../../utils/printWorkshopInvoice';

export const WorkshopOrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const id = Number(orderId);

  const [order, setOrder] = useState<WorkshopOrderDetail | null>(null);
  const [timeline, setTimeline] = useState<WorkshopOrderTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState('');

  const load = async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const [detailRes, timelineRes] = await Promise.all([
        workshopService.getWorkshopOrderById(id),
        workshopService.getWorkshopOrderTimeline(id),
      ]);
      const detail = detailRes.data.data ?? null;
      setOrder(detail);
      setTimeline(timelineRes.data.data ?? null);
      setTrackingCode(detail?.trackingCode ?? '');
    } catch {
      setError('Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await action();
      setSuccessMessage(message);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể thực hiện thao tác.');
    } finally {
      setSaving(false);
    }
  };

  const canCancel =
    order?.status === 'PENDING' || order?.status === 'DEPOSITED' || order?.status === 'PRODUCING';

  const backPath =
    order?.orderType === 'CUSTOM' ? '/workshop/production-management' : '/workshop/production';

  return (
    <WorkshopLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Link to={backPath} className="hover:text-secondary">
            Quản lý đơn hàng
          </Link>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="text-on-surface">DH-{orderId}</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-outline-variant bg-surface p-12 text-center text-sm text-on-surface-variant">
            Đang tải…
          </div>
        ) : !order ? (
          <div className="rounded-2xl border border-outline-variant bg-surface p-12 text-center">
            <p className="text-on-surface-variant">Không tìm thấy đơn hàng.</p>
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white"
            >
              Quay lại
            </button>
          </div>
        ) : (
          <>
            <WorkshopPageHeader
              title={`Đơn hàng DH-${order.id}`}
              description={`${getOrderTypeLabel(order.orderType)} · ${order.customerName ?? 'Khách hàng'} · ${formatWorkshopDate(order.createdAt)}`}
              actions={
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClass(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => printWorkshopOrderInvoice(order)}
                    className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    In hóa đơn
                  </button>
                </div>
              }
            />

            {error ? (
              <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
            ) : null}
            {successMessage ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-2xl border border-outline-variant bg-surface p-6">
                  <h2 className="text-lg font-bold text-on-surface">Sản phẩm</h2>
                  <div className="mt-4 space-y-3">
                    {(order.items ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b border-outline-variant pb-3 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-on-surface">{item.productName}</p>
                          <p className="text-xs text-on-surface-variant">SL: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-on-surface">{formatWorkshopCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-1 border-t border-outline-variant pt-4 text-sm">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Phí vận chuyển</span>
                      <span>{formatWorkshopCurrency(order.shippingFee)}</span>
                    </div>
                    {(order.discountAmount ?? 0) > 0 ? (
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Giảm giá</span>
                        <span>-{formatWorkshopCurrency(order.discountAmount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-base font-bold text-on-surface">
                      <span>Tổng cộng</span>
                      <span className="text-secondary">{formatWorkshopCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </section>

                {(order.frontDesignUrl || order.backDesignUrl) && order.orderType === 'CUSTOM' ? (
                  <section className="rounded-2xl border border-outline-variant bg-surface p-6">
                    <h2 className="mb-4 text-lg font-bold text-on-surface">Thiết kế gia công</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {order.frontDesignUrl ? (
                        <img
                          src={workshopService.resolveAssetUrl(order.frontDesignUrl)}
                          alt="Mặt trước"
                          className="aspect-square w-full rounded-xl border border-outline-variant object-cover"
                        />
                      ) : null}
                      {order.backDesignUrl ? (
                        <img
                          src={workshopService.resolveAssetUrl(order.backDesignUrl)}
                          alt="Mặt sau"
                          className="aspect-square w-full rounded-xl border border-outline-variant object-cover"
                        />
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-outline-variant bg-surface p-6">
                  <h2 className="text-lg font-bold text-on-surface">Tiến độ đơn hàng</h2>
                  <div className="mt-4 space-y-3">
                    {timeline?.items?.map((step) => (
                      <div key={step.code} className="flex items-start gap-3">
                        <span
                          className={`material-symbols-outlined mt-0.5 ${step.completed ? 'text-green-600' : 'text-outline'}`}
                        >
                          {step.completed ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <div>
                          <p className="font-medium text-on-surface">{step.label}</p>
                          {step.note ? (
                            <p className="text-xs text-on-surface-variant">{step.note}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className="rounded-2xl border border-outline-variant bg-surface p-5">
                  <h2 className="font-bold text-on-surface">Khách hàng & giao hàng</h2>
                  <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                    <p>
                      <span className="font-semibold text-on-surface">{order.customerName ?? '—'}</span>
                    </p>
                    {order.customerPhone ? <p>{order.customerPhone}</p> : null}
                    {order.customerEmail ? <p>{order.customerEmail}</p> : null}
                    <div className="border-t border-outline-variant pt-3">
                      <p className="font-semibold text-on-surface">{order.receiverName ?? 'Người nhận'}</p>
                      {order.receiverPhone ? <p>{order.receiverPhone}</p> : null}
                      <p>{order.shippingAddress ?? '—'}</p>
                    </div>
                    {order.customerNote ? (
                      <p className="rounded-lg bg-surface-container-low p-3 text-xs">
                        Ghi chú: {order.customerNote}
                      </p>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-2xl border border-outline-variant bg-surface p-5 space-y-3">
                  <h2 className="font-bold text-on-surface">Vận chuyển</h2>
                  <input
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Mã vận đơn"
                    disabled={saving || order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                    className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm disabled:opacity-60"
                  />
                  {order.ghnOrderCode ? (
                    <p className="text-xs text-on-surface-variant">Mã GHN: {order.ghnOrderCode}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={saving || !trackingCode.trim()}
                    onClick={() =>
                      void runAction(
                        () => workshopService.updateWorkshopTracking(order.id, trackingCode.trim()),
                        'Đã cập nhật mã vận đơn.',
                      )
                    }
                    className="w-full rounded-xl border border-outline-variant py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Lưu mã vận đơn
                  </button>
                </section>

                <section className="rounded-2xl border border-outline-variant bg-surface p-5 space-y-2">
                  <h2 className="font-bold text-on-surface">Thao tác</h2>
                  {order.status === 'PENDING' ? (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          void runAction(
                            () => workshopService.acceptWorkshopOrder(order.id),
                            'Đã xác nhận nhận đơn.',
                          )
                        }
                        className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Xác nhận nhận đơn
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          if (!window.confirm('Từ chối đơn hàng này?')) return;
                          void runAction(
                            () => workshopService.rejectWorkshopOrder(order.id),
                            'Đã từ chối đơn hàng.',
                          );
                        }}
                        className="w-full rounded-xl border border-error/30 py-3 text-sm font-semibold text-error disabled:opacity-50"
                      >
                        Từ chối đơn
                      </button>
                    </>
                  ) : null}
                  {order.status === 'DEPOSITED' ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void runAction(
                          () => workshopService.updateWorkshopOrderStatus(order.id, 'PRODUCING'),
                          'Đã chuyển sang sản xuất.',
                        )
                      }
                      className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Bắt đầu sản xuất
                    </button>
                  ) : null}
                  {order.status === 'PRODUCING' ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void runAction(
                          () => workshopService.updateWorkshopOrderStatus(order.id, 'SHIPPED'),
                          'Đã cập nhật trạng thái giao hàng.',
                        )
                      }
                      className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Đánh dấu đã giao hàng
                    </button>
                  ) : null}
                  {canCancel && order.status !== 'PENDING' ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        if (!window.confirm('Hủy đơn hàng này?')) return;
                        void runAction(
                          () => workshopService.cancelWorkshopOrder(order.id),
                          'Đã hủy đơn hàng.',
                        );
                      }}
                      className="w-full rounded-xl border border-error/30 py-3 text-sm font-semibold text-error disabled:opacity-50"
                    >
                      Hủy đơn hàng
                    </button>
                  ) : null}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </WorkshopLayout>
  );
};
