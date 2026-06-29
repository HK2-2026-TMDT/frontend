import { useEffect, useState } from 'react';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type WorkshopQuote } from '../../services/endpoints/workshopService';

const formatCurrency = (value?: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);

export const QuoteManagementPage = () => {
  const [quotes, setQuotes] = useState<WorkshopQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<WorkshopQuote | null>(null);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [estimateDays, setEstimateDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadQuotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await workshopService.getWorkshopQuotes({ page: 0, size: 20, sort: 'createdAt,desc' });
      setQuotes(response.data.data?.content ?? []);
    } catch (loadError) {
      setQuotes([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách báo giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuotes();
  }, []);

  const handleSelectQuote = (quote: WorkshopQuote) => {
    setSelectedQuote(quote);
    setOfferedPrice(String(quote.offeredPrice ?? ''));
    setEstimateDays(String(quote.estimateDays ?? ''));
    setSuccessMessage(null);
  };

  const handleUpdateQuote = async () => {
    if (!selectedQuote) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await workshopService.updateWorkshopQuote(selectedQuote.id, {
        offeredPrice: Number(offeredPrice),
        estimateDays: Number(estimateDays),
      });
      setSuccessMessage(`Đã cập nhật báo giá #${selectedQuote.id}.`);
      setSelectedQuote(null);
      await loadQuotes();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật báo giá.');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawQuote = async (quoteId: number) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await workshopService.withdrawWorkshopQuote(quoteId);
      setSuccessMessage(`Đã rút báo giá #${quoteId}.`);
      await loadQuotes();
    } catch (withdrawError) {
      setError(withdrawError instanceof Error ? withdrawError.message : 'Không thể rút báo giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <WorkshopPageHeader
          title="Quản lý báo giá"
          description="Theo dõi và cập nhật các báo giá đã gửi cho khách hàng."
          actions={
            <button type="button" onClick={() => void loadQuotes()} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container">
              <span className="material-symbols-outlined text-base">refresh</span>
              Tải lại
            </button>
          }
        />

        {error && <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}
        {successMessage && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        {selectedQuote && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Chỉnh sửa báo giá</p>
              <h2 className="font-headline-sm text-on-surface text-2xl">Báo giá #{selectedQuote.id}</h2>
              <p className="text-sm text-on-surface-variant mt-2">{selectedQuote.postTitle ?? 'Bài đăng chưa có tiêu đề'}</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Đơn giá đề xuất</label>
                <input value={offeredPrice} onChange={(event) => setOfferedPrice(event.target.value)} type="number" className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số ngày ước tính</label>
                <input value={estimateDays} onChange={(event) => setEstimateDays(event.target.value)} type="number" className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
              </div>
              <button disabled={saving} onClick={() => void handleUpdateQuote()} className="w-full py-3 bg-secondary text-white rounded-xl font-bold text-sm disabled:opacity-50">{saving ? 'Đang lưu...' : 'Cập nhật báo giá'}</button>
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-on-surface-variant">Đang tải báo giá...</div>
          ) : quotes.length ? (
            <table className="w-full text-left">
              <thead className="bg-surface-container border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Báo giá</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Bài đăng</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Giá</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Thời gian</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-mono-label text-secondary font-bold text-sm">#{quote.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-on-surface">{quote.postTitle ?? `Bai dang #${quote.postId ?? quote.id}`}</p>
                      <p className="text-xs text-on-surface-variant">{quote.customerName ?? 'Khách hàng'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface font-bold">{formatCurrency(quote.offeredPrice)} đ</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{quote.estimateDays} ngày</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${quote.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{quote.status ?? 'PENDING'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleSelectQuote(quote)} className="px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface hover:border-secondary">Sửa</button>
                        <button onClick={() => void handleWithdrawQuote(quote.id)} disabled={saving} className="px-3 py-2 rounded-lg border border-error text-error text-xs font-bold disabled:opacity-50">Rút</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-sm text-on-surface-variant">Chưa có báo giá nào được gửi.</div>
          )}
        </div>
      </div>
    </WorkshopLayout>
  );
};
