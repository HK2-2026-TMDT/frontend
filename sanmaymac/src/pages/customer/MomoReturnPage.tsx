import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';

export const MomoReturnPage = () => {
  const [searchParams] = useSearchParams();
  const resultCode = searchParams.get('resultCode');
  const message = searchParams.get('message');
  const success = resultCode === '0';

  const orderId = useMemo(() => {
    const orderKey = searchParams.get('orderId');
    if (!orderKey) return null;
    const match = orderKey.match(/SMM-(\d+)-/);
    return match?.[1] ?? null;
  }, [searchParams]);

  const isBatchPayment = useMemo(() => {
    const orderKey = searchParams.get('orderId');
    return orderKey?.startsWith('SMM-BATCH-') ?? false;
  }, [searchParams]);

  return (
    <CustomerLayout>
      <main className="max-w-[760px] mx-auto px-4 md:px-8 py-16">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
          <span className={`material-symbols-outlined text-6xl ${success ? 'text-green-600' : 'text-error'}`}>
            {success ? 'check_circle' : 'error'}
          </span>
          <h1 className="text-2xl font-bold text-on-surface mt-4">
            {success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
          </h1>
          <p className="text-on-surface-variant mt-2">
            {message ? decodeURIComponent(message) : success
              ? isBatchPayment
                ? 'MoMo đã ghi nhận thanh toán gộp. Tiền sẽ được chia tự động cho từng xưởng.'
                : 'MoMo đã ghi nhận giao dịch thành công.'
              : 'Giao dịch chưa hoàn tất.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {orderId && (
              <Link to={`/orders/${orderId}`} className="btn-user-primary-sm">
                Xem đơn hàng
              </Link>
            )}
            <Link to="/orders" className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium">
              Về danh sách đơn
            </Link>
          </div>
        </div>
      </main>
    </CustomerLayout>
  );
};
