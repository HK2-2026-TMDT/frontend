import { useEffect, useState } from 'react';
import type { BiddingPostDetail } from '../../services/endpoints/biddingService';
import { biddingService } from '../../services/endpoints/biddingService';

interface EditTenderModalProps {
  post: BiddingPostDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTenderModal = ({ post, open, onClose, onSuccess }: EditTenderModalProps) => {
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(post.title);
    setDescription(post.description ?? '');
    setError(null);
  }, [open, post]);

  if (!open) return null;

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Tiêu đề và mô tả không được để trống.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await biddingService.updatePost(post.id, {
        title: title.trim(),
        description: description.trim(),
        aiImageUrl: post.aiImageUrl,
        frontDesignUrl: post.frontDesignUrl,
        backDesignUrl: post.backDesignUrl,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể cập nhật yêu cầu.';
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
        role="button"
        tabIndex={-1}
        aria-label="Đóng"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-on-surface">Sửa yêu cầu báo giá</h3>
        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </div>
        ) : null}
        <div>
          <label className="text-sm font-medium text-on-surface" htmlFor="tender-title">
            Tiêu đề
          </label>
          <input
            id="tender-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface" htmlFor="tender-desc">
            Mô tả
          </label>
          <textarea
            id="tender-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-outline-variant px-3 py-2 text-sm resize-none"
          />
        </div>
        <div className="flex gap-3">
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
            onClick={() => void handleSave()}
            className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};
