import { useEffect, useState } from 'react';
import {
  reviewService,
  type Review,
  type CreateReviewPayload,
} from '../../services/endpoints/reviewService';

interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: number;
  productId?: number;
  existing?: Review | null;
}

export const ReviewFormModal = ({
  open,
  onClose,
  onSuccess,
  orderId,
  productId,
  existing,
}: ReviewFormModalProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRating(existing?.rating ?? 5);
    setComment(existing?.comment ?? '');
    setError(null);
  }, [open, existing]);

  if (!open) return null;

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await reviewService.update(existing.id, { rating, comment: comment.trim() || undefined });
      } else {
        const payload: CreateReviewPayload = {
          orderId,
          rating,
          comment: comment.trim() || undefined,
        };
        if (productId) payload.productId = productId;
        await reviewService.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể lưu đánh giá.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={() => !saving && onClose()}
        onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Đóng"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-on-surface">
          {existing ? 'Sửa đánh giá' : 'Viết đánh giá'}
        </h3>

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div>
          <p className="text-sm font-medium text-on-surface mb-2">Số sao</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1"
                aria-label={`${star} sao`}
              >
                <span
                  className="material-symbols-outlined text-3xl text-amber-500"
                  style={{ fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}` }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-on-surface" htmlFor="review-comment">
            Nhận xét
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-outline-variant px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-secondary outline-none"
            placeholder="Chia sẻ trải nghiệm của bạn..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
};
