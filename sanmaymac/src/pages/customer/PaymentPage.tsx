import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { orderService, type OrderDetail } from '../../services/endpoints/orderService';
import { financeService } from '../../services/endpoints/financeService';

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

export const PaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const standalone = searchParams.get('standalone') === '1';
  const orderId = Number(id);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await orderService.getMyOrderDetail(orderId);
        const detail = res.data.data;
        if (detail?.checkoutBatchId && !standalone) {
          navigate(`/payment/batch/${detail.checkoutBatchId}`, { replace: true });
          return;
        }
        if (mounted) setOrder(detail);
      } catch {
        if (mounted) setError('Không thể tải thông tin đơn hàng.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (orderId) void loadOrder();
    return () => {
      mounted = false;
    };
  }, [orderId, navigate, standalone]);

  const handleDeposit = async () => {
    setProcessing(true);
    setError(null);
    setMessage(null);
    try {
      const amount = depositAmount ? Number(depositAmount) : undefined;
      await financeService.payOrderDeposit(orderId, amount);
      setMessage('Đã thanh toán cọc thành công.');
    } catch {
      setError('Thanh toán cọc thất bại.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayBalance = async () => {
    setProcessing(true);
    setError(null);
    setMessage(null);
    try {
      await financeService.payOrderBalance(orderId);
      setMessage('Đã thanh toán phần còn lại thành công.');
    } catch {
      setError('Thanh toán số dư thất bại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleMomo = async (phase: 'deposit' | 'full') => {
    setProcessing(true);
    setError(null);
    try {
      const res = await financeService.createMomoPayment(orderId, { phase });
      const payUrl = res.data.data?.payUrl;
      if (!payUrl) {
        throw new Error('No payUrl');
      }
      window.location.href = payUrl;
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không tạo được phiên thanh toán MoMo.');
      setProcessing(false);
    }
  };

  return (
    <CustomerLayout>
      <main className="max-w-[900px] mx-auto px-4 md:px-8 py-10 space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/orders" className="text-on-surface-variant hover:text-secondary">Đơn hàng</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to={`/orders/${orderId}`} className="text-on-surface-variant hover:text-secondary">Chi tiết đơn</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-secondary font-medium">Thanh toán</span>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}
        {message && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

        {loading || !order ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
            Đang tải thông tin thanh toán...
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
              <h1 className="text-2xl font-bold text-on-surface">Thanh toán đơn #DH-{order.id}</h1>
              <p className="text-sm text-on-surface-variant mt-1">Tổng thanh toán: <span className="font-semibold text-secondary">{fmt(order.totalAmount ?? 0)}</span></p>
              {standalone && order.checkoutBatchId ? (
                <p className="text-xs text-amber-700 mt-2">
                  Thanh toán ví cho đơn lẻ (không qua thanh toán gộp MoMo).
                </p>
              ) : null}
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
              <h2 className="font-bold text-on-surface">Thanh toán nội bộ</h2>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  type="number"
                  placeholder="Nhập số tiền cọc (để trống dùng mặc định)"
                  className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm"
                />
                <button
                  onClick={() => void handleDeposit()}
                  disabled={processing}
                  className="btn-user-outline-sm disabled:opacity-50"
                >
                  Thanh toán cọc
                </button>
              </div>
              <button
                onClick={() => void handlePayBalance()}
                disabled={processing}
                className="btn-user-primary-md disabled:opacity-50"
              >
                Thanh toán phần còn lại
              </button>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-3">
              <h2 className="font-bold text-on-surface">Thanh toán MoMo (test)</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void handleMomo('deposit')}
                  disabled={processing}
                  className="btn-user-outline-sm disabled:opacity-50"
                >
                  MoMo thanh toán cọc
                </button>
                <button
                  onClick={() => void handleMomo('full')}
                  disabled={processing}
                  className="btn-user-primary-sm disabled:opacity-50"
                >
                  MoMo thanh toán toàn bộ
                </button>
              </div>
            </section>

            <button
              onClick={() => navigate(`/orders/${order.id}`)}
              className="btn-user-chip px-4 py-2 text-sm"
            >
              Quay lại chi tiết đơn
            </button>
          </>
        )}
      </main>
    </CustomerLayout>
  );
};
