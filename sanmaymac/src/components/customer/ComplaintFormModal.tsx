import { useRef, useState } from 'react';
import { complaintService } from '../../services/endpoints/complaintService';

interface ComplaintFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: number;
  workshopName?: string;
}

export const ComplaintFormModal = ({
  open,
  onClose,
  onSuccess,
  orderId,
  workshopName,
}: ComplaintFormModalProps) => {
  const [reason, setReason] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const response = await complaintService.uploadImage(file);
        const url = response.data.data?.imageUrl;
        if (url) uploaded.push(url);
      }
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, 10));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể tải ảnh lên.';
      setError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError('Lý do khiếu nại phải có ít nhất 10 ký tự.');
      return;
    }
    if (imageUrls.length === 0) {
      setError('Vui lòng đính kèm ít nhất một hình ảnh minh chứng.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await complaintService.create({ orderId, reason: trimmed, imageUrls });
      onSuccess();
      onClose();
      setReason('');
      setImageUrls([]);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể gửi khiếu nại.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={() => !saving && !uploading && onClose()}
        onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Đóng"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-on-surface">Khiếu nại xưởng may</h3>
        <p className="text-sm text-on-surface-variant">
          Đơn hàng #{orderId}
          {workshopName ? ` · Xưởng: ${workshopName}` : ''}
        </p>

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-on-surface" htmlFor="complaint-reason">
            Lý do khiếu nại <span className="text-error">*</span>
          </label>
          <textarea
            id="complaint-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-outline-variant px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-secondary outline-none"
            placeholder="Mô tả chi tiết vấn đề khi nhận hàng (sai mẫu, lỗi chất lượng, thiếu hàng...)"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-on-surface mb-2">
            Hình ảnh minh chứng <span className="text-error">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-outline-variant">
                <img src={url} alt="Minh chứng" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1"
                  onClick={() => setImageUrls((prev) => prev.filter((item) => item !== url))}
                >
                  ×
                </button>
              </div>
            ))}
            {imageUrls.length < 10 ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-20 w-20 rounded-lg border border-dashed border-outline-variant text-on-surface-variant text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">add_photo_alternate</span>
                {uploading ? 'Đang tải…' : 'Thêm ảnh'}
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={saving || uploading}
            onClick={onClose}
            className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => void handleSubmit()}
            className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Đang gửi…' : 'Gửi khiếu nại'}
          </button>
        </div>
      </div>
    </div>
  );
};
