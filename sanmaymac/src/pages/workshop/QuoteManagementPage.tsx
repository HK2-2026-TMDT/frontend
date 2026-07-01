import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type WorkshopQuote } from '../../services/endpoints/workshopService';
import { QUOTE_STATUS_LABELS, quoteStatusClass } from '../../utils/biddingUi';

const PAGE_SIZE = 15;
const formatCurrency = (value?: number) => new Intl.NumberFormat('vi-VN').format(value ?? 0);

export const QuoteManagementPage = () => {
  const [quotes, setQuotes] = useState<WorkshopQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedQuote, setSelectedQuote] = useState<WorkshopQuote | null>(null);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [estimateDays, setEstimateDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadQuotes = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);

    try {
      const response = await workshopService.getWorkshopQuotes({
        status: statusFilter || undefined,
        page: targetPage,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
      });
      const data = response.data.data;
      setQuotes(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setPage(data?.number ?? targetPage);
    } catch (loadError) {
      setQuotes([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách báo giá.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    void loadQuotes(0);
  }, [statusFilter]);

  const filtered = quotes.filter((quote) => {
    if (!keyword.trim()) return true;
    const term = keyword.trim().toLowerCase();
    return (
      String(quote.id).includes(term) ||
      quote.postTitle?.toLowerCase().includes(term) ||
      quote.customerName?.toLowerCase().includes(term)
    );
  });

  const handleSelectQuote = (quote: WorkshopQuote) => {
    if (quote.status !== 'PENDING') return;
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
      await loadQuotes(page);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật báo giá.');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawQuote = async (quote: WorkshopQuote) => {
    if (quote.status !== 'PENDING') return;
    if (!window.confirm(`Rút báo giá #${quote.id}? Hành động không thể hoàn tác.`)) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await workshopService.withdrawWorkshopQuote(quote.id);
      setSuccessMessage(`Đã rút báo giá #${quote.id}.`);
      if (selectedQuote?.id === quote.id) setSelectedQuote(null);
      await loadQuotes(page);
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
          description="Theo dõi, cập nhật và rút các báo giá đã gửi cho khách hàng."
          actions={
            <Link
              to="/workshop/marketplace"
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              Chợ đấu thầu
            </Link>
          }
        />

        {error ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 md:grid-cols-[1fr_180px_auto]">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Lọc nhanh theo tiêu đề bài hoặc khách…"
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ phản hồi</option>
            <option value="ACCEPTED">Được chọn</option>
            <option value="REJECTED">Không được chọn / Đã rút</option>
          </select>
          <button
            type="button"
            onClick={() => void loadQuotes(page)}
            className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-semibold hover:bg-surface-container"
          >
            Tải lại
          </button>
        </div>

        {selectedQuote ? (
          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Sửa báo giá</p>
              <h2 className="text-2xl font-bold text-on-surface">Báo giá #{selectedQuote.id}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {selectedQuote.postTitle ?? `Bài #${selectedQuote.postId}`}
                {selectedQuote.customerName ? ` · ${selectedQuote.customerName}` : ''}
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Giá đề xuất (VND)
                </label>
                <input
                  value={offeredPrice}
                  onChange={(event) => setOfferedPrice(event.target.value)}
                  type="number"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Số ngày ước tính
                </label>
                <input
                  value={estimateDays}
                  onChange={(event) => setEstimateDays(event.target.value)}
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setSelectedQuote(null)}
                  className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleUpdateQuote()}
                  className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving ? 'Đang lưu…' : 'Cập nhật'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-on-surface-variant">Đang tải báo giá…</div>
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-outline-variant bg-surface-container">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Báo giá
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Bài đăng
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Giá
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Thời gian
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.map((quote) => {
                    const isPending = quote.status === 'PENDING';
                    return (
                      <tr key={quote.id} className="transition-colors hover:bg-surface-container-low">
                        <td className="px-6 py-4 text-sm font-bold text-secondary">#{quote.id}</td>
                        <td className="px-6 py-4">
                          {quote.postId ? (
                            <Link
                              to={`/workshop/marketplace/${quote.postId}`}
                              className="text-sm font-bold text-on-surface hover:text-secondary"
                            >
                              {quote.postTitle ?? `Bài #${quote.postId}`}
                            </Link>
                          ) : (
                            <p className="text-sm font-bold text-on-surface">
                              {quote.postTitle ?? '—'}
                            </p>
                          )}
                          <p className="text-xs text-on-surface-variant">{quote.customerName ?? 'Khách hàng'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-on-surface">
                          {formatCurrency(quote.offeredPrice)}₫
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">{quote.estimateDays} ngày</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold ${quoteStatusClass(quote.status)}`}
                          >
                            {QUOTE_STATUS_LABELS[quote.status ?? ''] ?? quote.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSelectQuote(quote)}
                                  className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold text-on-surface hover:border-secondary"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void handleWithdrawQuote(quote)}
                                  className="rounded-lg border border-error px-3 py-2 text-xs font-bold text-error disabled:opacity-50"
                                >
                                  Rút
                                </button>
                              </>
                            ) : (
                              <Link
                                to={`/workshop/marketplace/${quote.postId}`}
                                className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold text-secondary"
                              >
                                Xem bài
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-on-surface-variant">
              Chưa có báo giá nào.{' '}
              <Link to="/workshop/marketplace" className="font-semibold text-secondary hover:underline">
                Xem bài đăng gia công
              </Link>
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 0 || loading}
              onClick={() => void loadQuotes(page - 1)}
              className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-on-surface-variant">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => void loadQuotes(page + 1)}
              className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        ) : null}
      </div>
    </WorkshopLayout>
  );
};
