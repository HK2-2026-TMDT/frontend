import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { financeService, type CheckoutBatchSummary } from '../../services/endpoints/financeService';

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

export const BatchPaymentPage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CheckoutBatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    financeService
      .getCheckoutBatchSummary(batchId)
      .then((res) => setSummary(res.data.data ?? null))
      .catch((err: any) => setError(err?.response?.data?.message ?? 'Không tải được thông tin thanh toán.'))
      .finally(() => setLoading(false));
  }, [batchId]);

  const handleMomo = async (phase: 'deposit' | 'full') => {
    if (!batchId) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await financeService.createBatchMomoPayment(batchId, { phase });
      const payUrl = res.data.data?.payUrl;
      if (!payUrl) throw new Error('No payUrl');
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
          <span className="text-secondary font-medium">Thanh toán gộp</span>
        </div>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        )}

        {loading || !summary ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
            Đang tải thông tin thanh toán...
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-3">
              <h1 className="text-2xl font-bold text-on-surface">Thanh toán {summary.orderCount} đơn hàng</h1>
              <p className="text-sm text-on-surface-variant">
                Bạn chỉ cần thanh toán <span className="font-semibold text-secondary">một lần</span>.
                Hệ thống sẽ tự chia tiền cho từng xưởng.
              </p>
              <div className="flex justify-between text-sm pt-2 border-t border-outline-variant">
                <span className="text-on-surface-variant">Tổng cần thanh toán</span>
                <span className="font-bold text-orange-600 text-lg">{fmt(summary.remainingTotal ?? 0)}</span>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-3">
              <h2 className="font-bold text-on-surface">Chi tiết theo xưởng</h2>
              {summary.orders.map((item) => (
                <div key={item.orderId} className="flex justify-between items-center py-2 border-b border-outline-variant last:border-0">
                  <div>
                    <p className="font-medium text-sm text-on-surface">#{item.orderId} · {item.workshopName ?? 'Xưởng'}</p>
                    <p className="text-xs text-on-surface-variant">Còn lại: {fmt(item.remainingAmount ?? 0)}</p>
                  </div>
                  <span className="text-sm font-semibold">{fmt(item.totalAmount ?? 0)}</span>
                </div>
              ))}
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-3">
              <h2 className="font-bold text-on-surface">Thanh toán MoMo</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void handleMomo('deposit')}
                  disabled={processing || (summary.remainingTotal ?? 0) <= 0}
                  className="btn-user-outline-sm disabled:opacity-50"
                >
                  MoMo thanh toán cọc
                </button>
                <button
                  onClick={() => void handleMomo('full')}
                  disabled={processing || (summary.remainingTotal ?? 0) <= 0}
                  className="btn-user-primary-sm disabled:opacity-50"
                >
                  MoMo thanh toán toàn bộ
                </button>
              </div>
            </section>

            <button
              onClick={() => navigate('/orders')}
              className="btn-user-chip px-4 py-2 text-sm"
            >
              Xem danh sách đơn hàng
            </button>
          </>
        )}
      </main>
    </CustomerLayout>
  );
};
