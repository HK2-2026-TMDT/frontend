import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkshopRevenueChart } from '../../components/workshop/WorkshopRevenueChart';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import {
  workshopService,
  type WorkshopBankAccount,
  type WorkshopPayout,
  type WorkshopRevenueReport,
  type WorkshopTransaction,
  type WorkshopWallet,
} from '../../services/endpoints/workshopService';
import {
  formatWorkshopCurrency,
  formatWorkshopDate,
  getPayoutStatusLabel,
  getTransactionTypeLabel,
} from '../../utils/workshopUi';

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const defaultDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toIsoDate(from), to: toIsoDate(to) };
};

const TRANSACTION_TYPES = [
  '',
  'ORDER_PAYMENT',
  'ESCROW_HOLD',
  'ESCROW_RELEASE',
  'PAYOUT',
  'COMMISSION_FEE',
  'REFUND',
  'AI_TOKEN_PURCHASE',
] as const;

const TRANSACTION_STATUSES = ['', 'PENDING', 'SUCCESS', 'FAILED'] as const;

export const WorkshopFinancialPage = () => {
  const initialRange = defaultDateRange();
  const [wallet, setWallet] = useState<WorkshopWallet | null>(null);
  const [bankAccount, setBankAccount] = useState<WorkshopBankAccount | null>(null);
  const [transactions, setTransactions] = useState<WorkshopTransaction[]>([]);
  const [payouts, setPayouts] = useState<WorkshopPayout[]>([]);
  const [revenue, setRevenue] = useState<WorkshopRevenueReport | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [revenueFrom, setRevenueFrom] = useState(initialRange.from);
  const [revenueTo, setRevenueTo] = useState(initialRange.to);
  const [revenueGroupBy, setRevenueGroupBy] = useState<'day' | 'month'>('day');
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('');

  const loadFinance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [walletResponse, bankResponse, transactionsResponse, payoutsResponse, revenueResponse] =
        await Promise.allSettled([
          workshopService.getWorkshopWallet(),
          workshopService.getWorkshopBankAccount(),
          workshopService.getWorkshopTransactions({
            type: txTypeFilter || undefined,
            status: txStatusFilter || undefined,
          }),
          workshopService.getWorkshopPayouts(),
          workshopService.getWorkshopRevenue({
            from: revenueFrom,
            to: revenueTo,
            groupBy: revenueGroupBy,
          }),
        ]);

      if (walletResponse.status === 'fulfilled') setWallet(walletResponse.value.data.data ?? null);
      if (bankResponse.status === 'fulfilled') setBankAccount(bankResponse.value.data.data ?? null);
      if (transactionsResponse.status === 'fulfilled') {
        setTransactions(transactionsResponse.value.data.data ?? []);
      }
      if (payoutsResponse.status === 'fulfilled') setPayouts(payoutsResponse.value.data.data ?? []);
      if (revenueResponse.status === 'fulfilled') {
        setRevenue(revenueResponse.value.data.data ?? null);
      }

      if (
        walletResponse.status === 'rejected' &&
        transactionsResponse.status === 'rejected' &&
        payoutsResponse.status === 'rejected' &&
        revenueResponse.status === 'rejected'
      ) {
        throw walletResponse.reason ?? transactionsResponse.reason;
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu tài chính.');
    } finally {
      setLoading(false);
    }
  }, [revenueFrom, revenueTo, revenueGroupBy, txTypeFilter, txStatusFilter]);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const revenueTotal = useMemo(
    () => revenue?.items?.reduce((sum, item) => sum + item.revenue, 0) ?? 0,
    [revenue],
  );

  const requestPayout = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await workshopService.requestWorkshopPayout(Number(payoutAmount));
      setSuccessMessage('Đã gửi yêu cầu rút tiền.');
      setPayoutAmount('');
      await loadFinance();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi yêu cầu rút tiền.');
    } finally {
      setSaving(false);
    }
  };

  const cancelPayout = async (payoutId: number) => {
    if (!window.confirm('Hủy yêu cầu rút tiền này?')) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await workshopService.cancelWorkshopPayout(payoutId);
      setSuccessMessage('Đã hủy yêu cầu rút tiền.');
      await loadFinance();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Không thể hủy yêu cầu rút tiền.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="space-y-8">
        <WorkshopPageHeader
          title="Quản lý tài chính"
          description="Theo dõi quỹ, giao dịch, doanh thu và rút tiền."
        />

        {error ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-white shadow-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-80">Số dư khả dụng</p>
            <h2 className="mb-4 text-3xl font-bold">{loading ? '…' : formatWorkshopCurrency(wallet?.availableBalance)}</h2>
            <p className="text-xs opacity-90">Đang chờ giải ngân: {formatWorkshopCurrency(wallet?.pendingBalance)}</p>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quỹ đang giữ</p>
            <h2 className="mb-2 text-3xl font-bold text-amber-600">
              {loading ? '…' : formatWorkshopCurrency(wallet?.pendingBalance)}
            </h2>
            <p className="text-xs text-on-surface-variant">Tiền chờ hoàn tất đơn hàng</p>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Doanh thu kỳ</p>
            <h2 className="mb-2 text-3xl font-bold text-on-surface">{loading ? '…' : formatWorkshopCurrency(revenueTotal)}</h2>
            <p className="text-xs text-on-surface-variant">
              {formatWorkshopDate(revenueFrom)} – {formatWorkshopDate(revenueTo)}
            </p>
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tài khoản ngân hàng</p>
            {bankAccount ? (
              <>
                <p className="text-sm font-semibold text-on-surface">{bankAccount.bankName}</p>
                <p className="text-xs text-on-surface-variant">{bankAccount.accountNo}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    bankAccount.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {bankAccount.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                </span>
              </>
            ) : (
              <>
                <p className="text-sm text-on-surface-variant">Chưa cập nhật</p>
                <Link to="/workshop/settings" className="mt-2 inline-block text-xs font-semibold text-secondary hover:underline">
                  Cập nhật tài khoản →
                </Link>
              </>
            )}
          </div>
        </div>

        <section className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Báo cáo & biểu đồ doanh thu</h3>
              <p className="text-sm text-on-surface-variant">Doanh thu giải ngân theo thời gian</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={revenueFrom}
                onChange={(e) => setRevenueFrom(e.target.value)}
                className="rounded-xl border border-outline-variant px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={revenueTo}
                onChange={(e) => setRevenueTo(e.target.value)}
                className="rounded-xl border border-outline-variant px-3 py-2 text-sm"
              />
              <select
                value={revenueGroupBy}
                onChange={(e) => setRevenueGroupBy(e.target.value as 'day' | 'month')}
                className="rounded-xl border border-outline-variant px-3 py-2 text-sm"
              >
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
              </select>
            </div>
          </div>

          <WorkshopRevenueChart items={revenue?.items ?? []} groupBy={revenueGroupBy} />

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-xs uppercase text-on-surface-variant">
                  <th className="py-3 pr-4">Kỳ</th>
                  <th className="py-3 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {(revenue?.items ?? []).length ? (
                  revenue?.items.map((item) => (
                    <tr key={item.date}>
                      <td className="py-3 pr-4 text-on-surface">{item.date}</td>
                      <td className="py-3 text-right font-semibold text-on-surface">
                        {formatWorkshopCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-on-surface-variant">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
              {(revenue?.items ?? []).length ? (
                <tfoot>
                  <tr className="border-t-2 border-outline-variant font-bold">
                    <td className="py-3">Tổng cộng</td>
                    <td className="py-3 text-right text-secondary">{formatWorkshopCurrency(revenueTotal)}</td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
              <h3 className="font-headline-sm text-on-surface">Lịch sử giao dịch</h3>
              <div className="flex flex-wrap gap-2">
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="rounded-xl border border-outline-variant px-3 py-2 text-xs"
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <option key={type || 'all'} value={type}>
                      {type ? getTransactionTypeLabel(type) : 'Tất cả loại'}
                    </option>
                  ))}
                </select>
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="rounded-xl border border-outline-variant px-3 py-2 text-xs"
                >
                  {TRANSACTION_STATUSES.map((status) => (
                    <option key={status || 'all'} value={status}>
                      {status || 'Tất cả trạng thái'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-sm text-on-surface-variant">Đang tải giao dịch…</div>
              ) : transactions.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="border-b border-outline-variant bg-surface-container-low">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Mã GD
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Loại
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Ngày
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Số tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="transition-all hover:bg-surface-container">
                          <td className="px-6 py-4 font-mono text-sm text-on-surface-variant">TX-{tx.id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-on-surface">
                            {getTransactionTypeLabel(tx.type)}
                          </td>
                          <td className="px-6 py-4 text-xs text-on-surface-variant">
                            {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                                tx.status === 'SUCCESS'
                                  ? 'bg-green-100 text-green-700'
                                  : tx.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 text-right text-sm font-bold ${
                              tx.direction === 'IN' ? 'text-green-600' : 'text-error'
                            }`}
                          >
                            {tx.direction === 'IN' ? '+' : '-'}
                            {formatWorkshopCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-on-surface-variant">Chưa có giao dịch nào.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4 rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <h4 className="font-bold text-on-surface">Tạo lệnh rút tiền</h4>
              {!bankAccount?.isVerified ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Cần tài khoản ngân hàng đã xác minh trước khi rút tiền.{' '}
                  <Link to="/workshop/settings" className="font-semibold underline">
                    Cập nhật ngay
                  </Link>
                </p>
              ) : null}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Số tiền</label>
                <input
                  value={payoutAmount}
                  onChange={(event) => setPayoutAmount(event.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="1000000"
                />
                <p className="text-xs text-on-surface-variant">
                  Khả dụng: {formatWorkshopCurrency(wallet?.availableBalance)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void requestPayout()}
                disabled={saving || !payoutAmount || !bankAccount?.isVerified}
                className="w-full rounded-xl bg-secondary py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? 'Đang gửi…' : 'Gửi yêu cầu rút tiền'}
              </button>
            </div>

            <div className="space-y-4 rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <h4 className="font-bold text-on-surface">Yêu cầu rút tiền</h4>
              <div className="space-y-3">
                {payouts.length ? (
                  payouts.map((payout) => (
                    <div key={payout.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{formatWorkshopCurrency(payout.amount)}</p>
                          <p className="text-xs text-on-surface-variant">
                            {new Date(payout.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                          {payout.adminNote ? (
                            <p className="mt-1 text-xs text-on-surface-variant">Ghi chú: {payout.adminNote}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              payout.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : payout.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {getPayoutStatusLabel(payout.status)}
                          </span>
                          {payout.status === 'PENDING' ? (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void cancelPayout(payout.id)}
                              className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
                            >
                              Hủy yêu cầu
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">Chưa có yêu cầu rút tiền nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkshopLayout>
  );
};
