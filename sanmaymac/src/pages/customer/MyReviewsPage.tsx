import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { ReviewFormModal } from '../../components/customer/ReviewFormModal';
import {
  reviewService,
  type Review,
  type UnreviewedOrder,
} from '../../services/endpoints/reviewService';

const fmt = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + '₫';

export const MyReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [unreviewed, setUnreviewed] = useState<UnreviewedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewsRes, unreviewedRes] = await Promise.all([
        reviewService.getMyReviews({ page: 0, size: 50, sort: 'createdAt,desc' }),
        reviewService.getUnreviewedOrders(),
      ]);
      setReviews(reviewsRes.data.data?.content ?? []);
      setUnreviewed(unreviewedRes.data.data ?? []);
    } catch {
      setError('Không thể tải đánh giá của bạn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = (orderId: number) => {
    setEditing(null);
    setReviewOrderId(orderId);
    setFormOpen(true);
  };

  const openEdit = (review: Review) => {
    setEditing(review);
    setReviewOrderId(review.orderId);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    setDeletingId(id);
    try {
      await reviewService.delete(id);
      await load();
    } catch {
      setError('Không thể xóa đánh giá.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Đánh giá</p>
          <h1 className="font-headline-lg text-on-surface">Đánh giá của tôi</h1>
          <p className="text-on-surface-variant mt-1">
            Quản lý đánh giá xưởng và sản phẩm sau khi hoàn thành đơn hàng.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-surface-container" />
        ) : (
          <>
            {unreviewed.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-on-surface">Chờ đánh giá</h2>
                {unreviewed.map((item) => (
                  <article
                    key={item.orderId}
                    className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-on-surface">Đơn hàng #{item.orderId}</p>
                      <p className="text-sm text-on-surface-variant">
                        {item.totalAmount != null ? fmt(Number(item.totalAmount)) : '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreate(item.orderId)}
                      className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white"
                    >
                      Viết đánh giá
                    </button>
                  </article>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface">Đã đánh giá</h2>
              {reviews.length ? (
                reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-outline-variant bg-surface p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">
                          Đơn #{review.orderId}
                          {review.productId ? ` · Sản phẩm #${review.productId}` : ' · Xưởng'}
                        </p>
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className="material-symbols-outlined text-amber-500 text-lg"
                              style={{ fontVariationSettings: `'FILL' ${s <= review.rating ? 1 : 0}` }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(review)}
                          className="btn-user-outline-sm"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === review.id}
                          onClick={() => void handleDelete(review.id)}
                          className="px-3 py-2 text-sm font-semibold text-error border border-error/30 rounded-xl"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    {review.comment ? (
                      <p className="text-sm text-on-surface-variant whitespace-pre-line">{review.comment}</p>
                    ) : null}
                    {review.replyContent ? (
                      <div className="rounded-xl bg-surface-container-lowest p-3 text-sm">
                        <p className="font-semibold text-on-surface mb-1">Phản hồi xưởng</p>
                        <p className="text-on-surface-variant">{review.replyContent}</p>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-outline-variant px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-outline">rate_review</span>
                  <p className="mt-3 text-sm text-on-surface-variant">Bạn chưa có đánh giá nào.</p>
                  <Link to="/orders" className="mt-4 inline-block text-secondary font-semibold text-sm">
                    Xem đơn hàng →
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {formOpen && reviewOrderId ? (
        <ReviewFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={() => void load()}
          orderId={reviewOrderId}
          productId={editing?.productId ?? undefined}
          existing={editing}
        />
      ) : null}
    </CustomerLayout>
  );
};
