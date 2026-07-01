import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import {
  workshopService,
  type BiddingPostDetail,
  type WorkshopQuote,
} from '../../services/endpoints/workshopService';
import { formatWorkshopDate } from '../../utils/workshopUi';
import { POST_STATUS_LABELS, QUOTE_STATUS_LABELS } from '../../utils/biddingUi';

export const WorkshopTenderDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const id = Number(postId);

  const [post, setPost] = useState<BiddingPostDetail | null>(null);
  const [myQuote, setMyQuote] = useState<WorkshopQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [estimateDays, setEstimateDays] = useState('7');

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [postRes, quoteRes] = await Promise.all([
          workshopService.getBiddingPostById(id),
          workshopService.getMyQuoteOnPost(id),
        ]);

        if (!mounted) return;

        const detail = postRes.data.data ?? null;
        setPost(detail);

        const existing = quoteRes.data.data ?? null;
        setMyQuote(existing);
        if (existing) {
          setOfferedPrice(String(existing.offeredPrice ?? ''));
          setEstimateDays(String(existing.estimateDays ?? 7));
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải chi tiết đấu thầu.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const designImages = useMemo(() => {
    if (!post) return [];
    const items = [
      { label: 'Mặt trước', url: post.frontDesignUrl },
      { label: 'Mặt sau', url: post.backDesignUrl },
      { label: 'Ảnh AI', url: post.aiImageUrl },
    ].filter((item) => item.url);
    return items;
  }, [post]);

  const canSubmitQuote = post?.status === 'OPEN' && !myQuote;
  const canEditQuote = myQuote?.status === 'PENDING';

  const handleSubmitQuote = async () => {
    if (!post || !offeredPrice || !estimateDays) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await workshopService.submitWorkshopQuote(post.id, {
        offeredPrice: Number(offeredPrice),
        estimateDays: Number(estimateDays),
      });
      setMyQuote(res.data.data ?? null);
      setSuccessMessage('Đã gửi báo giá thành công.');
      const refreshed = await workshopService.getBiddingPostById(post.id);
      setPost(refreshed.data.data ?? post);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể gửi báo giá.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuote = async () => {
    if (!myQuote) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await workshopService.updateWorkshopQuote(myQuote.id, {
        offeredPrice: Number(offeredPrice),
        estimateDays: Number(estimateDays),
      });
      setMyQuote(res.data.data ?? myQuote);
      setSuccessMessage('Đã cập nhật báo giá.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật báo giá.');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawQuote = async () => {
    if (!myQuote || !window.confirm('Rút báo giá này?')) return;

    setSaving(true);
    setError(null);

    try {
      await workshopService.withdrawWorkshopQuote(myQuote.id);
      const quoteRes = await workshopService.getMyQuoteOnPost(id);
      setMyQuote(quoteRes.data.data ?? null);
      setOfferedPrice('');
      setEstimateDays('7');
      setSuccessMessage('Đã rút báo giá.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể rút báo giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Link to="/workshop/marketplace" className="hover:text-secondary">
            Chợ đấu thầu
          </Link>
          <span className="material-symbols-outlined text-base">chevron_right</span>
          <span className="text-on-surface">Chi tiết #{postId}</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-outline-variant bg-surface p-12 text-center text-sm text-on-surface-variant">
            Đang tải chi tiết…
          </div>
        ) : !post ? (
          <div className="rounded-2xl border border-outline-variant bg-surface p-12 text-center">
            <p className="text-on-surface-variant">Không tìm thấy bài đấu thầu.</p>
            <button
              type="button"
              onClick={() => navigate('/workshop/marketplace')}
              className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white"
            >
              Quay lại danh sách
            </button>
          </div>
        ) : (
          <>
            <WorkshopPageHeader
              title={post.title}
              description={`Khách hàng: ${post.customerName ?? 'Ẩn danh'} · ${formatWorkshopDate(post.createdAt)}`}
              actions={
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    post.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {POST_STATUS_LABELS[post.status ?? ''] ?? post.status}
                </span>
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
                  <h2 className="text-lg font-bold text-on-surface">Mô tả yêu cầu</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                    {post.description?.trim() || 'Khách hàng chưa cung cấp mô tả chi tiết.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-on-surface-variant">
                    <span>{post.quoteCount ?? 0} báo giá</span>
                    <span>Mã bài: #{post.id}</span>
                  </div>
                </section>

                {designImages.length ? (
                  <section className="rounded-2xl border border-outline-variant bg-surface p-6">
                    <h2 className="mb-4 text-lg font-bold text-on-surface">Thiết kế / hình ảnh</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {designImages.map((img) => (
                        <div key={img.label} className="overflow-hidden rounded-xl border border-outline-variant">
                          <img
                            src={workshopService.resolveAssetUrl(img.url)}
                            alt={img.label}
                            className="aspect-square w-full object-cover"
                          />
                          <p className="border-t border-outline-variant px-3 py-2 text-xs font-medium text-on-surface-variant">
                            {img.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {post.attachments?.length ? (
                  <section className="rounded-2xl border border-outline-variant bg-surface p-6">
                    <h2 className="mb-4 text-lg font-bold text-on-surface">Tệp đính kèm</h2>
                    <ul className="space-y-2">
                      {post.attachments.map((file) => (
                        <li key={file.id}>
                          <a
                            href={workshopService.resolveAssetUrl(file.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-sm text-secondary hover:bg-surface-container"
                          >
                            <span className="material-symbols-outlined text-base">attach_file</span>
                            {file.fileType ?? 'Tệp đính kèm'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>

              <div className="space-y-4">
                <section className="sticky top-24 rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-on-surface">
                    {myQuote ? 'Báo giá của bạn' : 'Gửi báo giá'}
                  </h2>

                  {myQuote ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-on-surface-variant">
                        Trạng thái:{' '}
                        <span className="font-semibold text-on-surface">
                          {QUOTE_STATUS_LABELS[myQuote.status ?? ''] ?? myQuote.status}
                        </span>
                      </p>
                      {canEditQuote ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-on-surface">Giá đề xuất (VND)</label>
                            <input
                              type="number"
                              value={offeredPrice}
                              onChange={(e) => setOfferedPrice(e.target.value)}
                              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-on-surface">Số ngày hoàn thành</label>
                            <input
                              type="number"
                              min={1}
                              value={estimateDays}
                              onChange={(e) => setEstimateDays(e.target.value)}
                              className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleUpdateQuote()}
                            disabled={saving || !offeredPrice || !estimateDays}
                            className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {saving ? 'Đang lưu…' : 'Cập nhật báo giá'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleWithdrawQuote()}
                            disabled={saving}
                            className="w-full rounded-xl border border-error/30 py-3 text-sm font-semibold text-error disabled:opacity-50"
                          >
                            Rút báo giá
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl bg-surface-container-low p-4 text-sm">
                          <p>
                            Giá:{' '}
                            <span className="font-bold text-on-surface">
                              {Number(myQuote.offeredPrice).toLocaleString('vi-VN')}₫
                            </span>
                          </p>
                          <p className="mt-1">Thời gian: {myQuote.estimateDays} ngày</p>
                        </div>
                      )}
                    </div>
                  ) : canSubmitQuote ? (
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-on-surface">Giá đề xuất (VND) *</label>
                        <input
                          type="number"
                          min={0}
                          value={offeredPrice}
                          onChange={(e) => setOfferedPrice(e.target.value)}
                          placeholder="5000000"
                          className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-on-surface">Số ngày hoàn thành *</label>
                        <input
                          type="number"
                          min={1}
                          value={estimateDays}
                          onChange={(e) => setEstimateDays(e.target.value)}
                          className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSubmitQuote()}
                        disabled={saving || !offeredPrice || !estimateDays}
                        className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? 'Đang gửi…' : 'Gửi báo giá'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-on-surface-variant">
                      {post.status !== 'OPEN'
                        ? 'Bài đấu thầu đã đóng, không thể gửi báo giá mới.'
                        : 'Không thể gửi báo giá lúc này.'}
                    </p>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </WorkshopLayout>
  );
};
