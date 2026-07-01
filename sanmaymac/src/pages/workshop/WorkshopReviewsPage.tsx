import { useCallback, useEffect, useState } from 'react';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { reviewService, type Review } from '../../services/endpoints/reviewService';
import { workshopService, type WorkshopReputation } from '../../services/endpoints/workshopService';
import { formatWorkshopDate } from '../../utils/workshopUi';

const PAGE_SIZE = 10;

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`material-symbols-outlined text-base ${star <= rating ? 'text-amber-500' : 'text-outline'}`}
        style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </span>
    ))}
  </div>
);

export const WorkshopReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reputation, setReputation] = useState<WorkshopReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState('');
  const [hasImagesFilter, setHasImagesFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [replyReviewId, setReplyReviewId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [reportReviewId, setReportReviewId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      setError(null);
      try {
        const [reviewsRes, reputationRes] = await Promise.all([
          reviewService.getOwnedWorkshopReviews({
            rating: ratingFilter ? Number(ratingFilter) : undefined,
            hasImages: hasImagesFilter === '' ? undefined : hasImagesFilter === 'true',
            page: targetPage,
            size: PAGE_SIZE,
            sort: 'createdAt,desc',
          }),
          workshopService.getWorkshopReputation(),
        ]);

        const data = reviewsRes.data.data;
        setReviews(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 0);
        setPage(data?.number ?? targetPage);
        setReputation(reputationRes.data.data ?? null);
      } catch (loadError) {
        setReviews([]);
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách đánh giá.');
      } finally {
        setLoading(false);
      }
    },
    [ratingFilter, hasImagesFilter, page],
  );

  useEffect(() => {
    void loadReviews(0);
  }, [ratingFilter, hasImagesFilter]);

  const openReply = (review: Review) => {
    setReplyReviewId(review.id);
    setReplyContent(review.replyContent ?? '');
    setReportReviewId(null);
  };

  const openReport = (reviewId: number) => {
    setReportReviewId(reviewId);
    setReportReason('');
    setReplyReviewId(null);
  };

  const submitReply = async () => {
    if (!replyReviewId || !replyContent.trim()) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await reviewService.replyToReview(replyReviewId, replyContent.trim());
      setSuccessMessage('Đã gửi phản hồi đánh giá.');
      setReplyReviewId(null);
      setReplyContent('');
      await loadReviews(page);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi phản hồi.');
    } finally {
      setSaving(false);
    }
  };

  const submitReport = async () => {
    if (!reportReviewId || !reportReason.trim()) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await reviewService.reportReview(reportReviewId, reportReason.trim());
      setSuccessMessage('Đã gửi báo cáo đánh giá tới quản trị viên.');
      setReportReviewId(null);
      setReportReason('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi báo cáo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <WorkshopPageHeader
          title="Quản lý đánh giá"
          description="Xem phản hồi của khách hàng, trả lời và báo cáo đánh giá không phù hợp."
        />

        {error ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Điểm trung bình</p>
            <p className="mt-2 text-3xl font-bold text-secondary">
              {reputation ? reputation.averageRating.toFixed(1) : '—'}
              <span className="text-lg text-on-surface-variant"> / 5</span>
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tổng đánh giá</p>
            <p className="mt-2 text-3xl font-bold text-on-surface">{reputation?.totalReviews ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Đã phản hồi</p>
            <p className="mt-2 text-3xl font-bold text-on-surface">
              {reviews.filter((r) => r.replyContent).length}
              <span className="text-sm font-normal text-on-surface-variant"> / trang hiện tại</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm"
          >
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={String(star)}>
                {star} sao
              </option>
            ))}
          </select>
          <select
            value={hasImagesFilter}
            onChange={(e) => setHasImagesFilter(e.target.value)}
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm"
          >
            <option value="">Có/không ảnh</option>
            <option value="true">Có ảnh</option>
            <option value="false">Không ảnh</option>
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-outline-variant bg-surface p-12 text-center text-sm text-on-surface-variant">
              Đang tải đánh giá…
            </div>
          ) : reviews.length ? (
            reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <StarRating rating={review.rating} />
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Đơn #{review.orderId} · {formatWorkshopDate(review.createdAt)}
                      {review.status ? ` · ${review.status}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openReply(review)}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:border-secondary"
                    >
                      {review.replyContent ? 'Sửa phản hồi' : 'Phản hồi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openReport(review.id)}
                      className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-semibold text-error"
                    >
                      Báo cáo
                    </button>
                  </div>
                </div>

                {review.comment ? (
                  <p className="mt-4 text-sm leading-relaxed text-on-surface">{review.comment}</p>
                ) : (
                  <p className="mt-4 text-sm italic text-on-surface-variant">Khách không để lại bình luận.</p>
                )}

                {review.imageUrls?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.imageUrls.map((url) => (
                      <img
                        key={url}
                        src={workshopService.resolveAssetUrl(url)}
                        alt="Ảnh đánh giá"
                        className="h-20 w-20 rounded-lg border border-outline-variant object-cover"
                      />
                    ))}
                  </div>
                ) : null}

                {review.replyContent ? (
                  <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">Phản hồi của xưởng</p>
                    <p className="mt-2 text-sm text-on-surface">{review.replyContent}</p>
                    {review.replyAt ? (
                      <p className="mt-1 text-xs text-on-surface-variant">{formatWorkshopDate(review.replyAt)}</p>
                    ) : null}
                  </div>
                ) : null}

                {replyReviewId === review.id ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-outline-variant bg-surface p-4">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      placeholder="Viết phản hồi cho khách hàng…"
                      className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-secondary"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving || !replyContent.trim()}
                        onClick={() => void submitReply()}
                        className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? 'Đang gửi…' : 'Gửi phản hồi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyReviewId(null)}
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : null}

                {reportReviewId === review.id ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-error/20 bg-error/5 p-4">
                    <p className="text-sm font-semibold text-error">Báo cáo đánh giá</p>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      rows={3}
                      placeholder="Mô tả lý do báo cáo (spam, nội dung không phù hợp, v.v.)…"
                      className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-error"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving || !reportReason.trim()}
                        onClick={() => void submitReport()}
                        className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? 'Đang gửi…' : 'Gửi báo cáo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportReviewId(null)}
                        className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-outline-variant bg-surface p-12 text-center text-sm text-on-surface-variant">
              Chưa có đánh giá nào.
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 0 || loading}
              onClick={() => void loadReviews(page - 1)}
              className="rounded-xl border border-outline-variant px-4 py-2 text-sm disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-on-surface-variant">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => void loadReviews(page + 1)}
              className="rounded-xl border border-outline-variant px-4 py-2 text-sm disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        ) : null}
      </div>
    </WorkshopLayout>
  );
};
