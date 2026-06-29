import { useEffect, useMemo, useState } from 'react';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type WorkshopPayout, type WorkshopRevenueReport, type WorkshopTransaction, type WorkshopWallet } from '../../services/endpoints/workshopService';
import {
  formatWorkshopCurrency,
  getPayoutStatusLabel,
  getTransactionTypeLabel,
} from '../../utils/workshopUi';

export const WorkshopFinancialPage = () => {
  const [wallet, setWallet] = useState<WorkshopWallet | null>(null);
  const [transactions, setTransactions] = useState<WorkshopTransaction[]>([]);
  const [payouts, setPayouts] = useState<WorkshopPayout[]>([]);
  const [revenue, setRevenue] = useState<WorkshopRevenueReport | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadFinance = async () => {
    setLoading(true);
    setError(null);

    try {
      const [walletResponse, transactionsResponse, payoutsResponse, revenueResponse] = await Promise.allSettled([
        workshopService.getWorkshopWallet(),
        workshopService.getWorkshopTransactions(),
        workshopService.getWorkshopPayouts(),
        workshopService.getWorkshopRevenue({ groupBy: 'month' }),
      ]);

      if (walletResponse.status === 'fulfilled') setWallet(walletResponse.value.data.data ?? null);
      if (transactionsResponse.status === 'fulfilled') setTransactions(transactionsResponse.value.data.data ?? []);
      if (payoutsResponse.status === 'fulfilled') setPayouts(payoutsResponse.value.data.data ?? []);
      if (revenueResponse.status === 'fulfilled') setRevenue(revenueResponse.value.data.data ?? null);

      if (
        walletResponse.status === 'rejected' &&
        transactionsResponse.status === 'rejected' &&
        payoutsResponse.status === 'rejected' &&
        revenueResponse.status === 'rejected'
      ) {
        throw walletResponse.reason ?? transactionsResponse.reason ?? payoutsResponse.reason ?? revenueResponse.reason;
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu tài chính.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFinance();
  }, []);

  const revenueTotal = useMemo(() => revenue?.items?.reduce((sum, item) => sum + item.revenue, 0) ?? 0, [revenue]);

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

  return (
    <WorkshopLayout>
      <div className="space-y-8">
        <WorkshopPageHeader
          title="Quản lý tài chính"
          description="Số dư ví, lịch sử giao dịch và yêu cầu rút tiền."
          actions={
            <button
              type="button"
              onClick={() => void requestPayout()}
              disabled={saving || !payoutAmount}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">account_balance</span>
              {saving ? 'Đang xử lý…' : 'Rút tiền'}
            </button>
          }
        />

        {error && <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}
        {successMessage && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Số dư hiện tại</p>
              <h2 className="mb-8 text-3xl font-bold">{loading ? '…' : formatWorkshopCurrency(wallet?.availableBalance)}</h2>
              <div className="flex justify-between items-center text-xs opacity-90">
                <span>Đang chờ: {formatWorkshopCurrency(wallet?.pendingBalance)}</span>
                <span className="material-symbols-outlined">info</span>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl shadow-sm">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-2">Doanh thu tổng hợp</p>
            <h2 className="mb-2 text-3xl font-bold text-on-surface">{loading ? '…' : formatWorkshopCurrency(revenueTotal)}</h2>
            <p className="text-xs text-on-surface-variant">Theo báo cáo doanh thu</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-3xl shadow-sm">
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-2">Lượt AI token</p>
            <h2 className="mb-2 text-3xl font-bold text-on-surface">{loading ? '…' : String(wallet?.aiTokenBalance ?? 0)}</h2>
            <p className="text-xs text-on-surface-variant">Token AI còn lại</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-headline-sm text-on-surface">Lịch sử giao dịch</h3>
              <button onClick={() => void loadFinance()} className="text-secondary font-bold text-xs hover:underline uppercase tracking-widest">Tải lại</button>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-sm text-on-surface-variant">Đang tải giao dịch...</div>
              ) : transactions.length ? (
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Mã GD</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Loại giao dịch</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ngày</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-container transition-all">
                        <td className="px-6 py-4 font-mono-label text-on-surface-variant text-sm">TX-{tx.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-on-surface">{getTransactionTypeLabel(tx.type)}</td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4">
                          <span className={'px-3 py-1 rounded-full text-[10px] font-bold ' + (tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                            {tx.status}
                          </span>
                        </td>
                        <td className={'px-6 py-4 text-right font-bold text-sm ' + (tx.direction === 'IN' ? 'text-green-600' : 'text-error')}>
                          {tx.direction === 'IN' ? '+' : '-'}{formatWorkshopCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm text-on-surface-variant">Chưa có giao dịch nào.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-on-surface">Yêu cầu rút tiền</h4>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số tiền</label>
                <input value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} type="number" className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" placeholder="1000000" />
              </div>
              <button onClick={() => void requestPayout()} disabled={saving || !payoutAmount} className="w-full py-3 bg-secondary text-white rounded-xl font-bold text-sm disabled:opacity-50">{saving ? 'Đang gửi...' : 'Gửi yêu cầu rút tiền'}</button>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-on-surface">Danh sách yêu cầu rút tiền</h4>
              <div className="space-y-3">
                {payouts.length ? payouts.map((payout) => (
                  <div key={payout.id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{formatWorkshopCurrency(payout.amount)}</p>
                        <p className="text-xs text-on-surface-variant">{new Date(payout.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${payout.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : payout.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-surface-container-high text-on-surface-variant'}`}>{getPayoutStatusLabel(payout.status)}</span>
                    </div>
                  </div>
                )) : <p className="text-sm text-on-surface-variant">Chưa có yêu cầu rút tiền nào.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkshopLayout>
  );
};
