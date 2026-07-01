import { useEffect, useMemo, useState } from 'react';
import {
  catalogService,
  type Category,
  type Product,
  type ProductPayload,
} from '../../services/endpoints/catalogService';
import { ProductImageEditor } from './ProductImageEditor';
import {
  draftsToPayload,
  ProductVariantEditor,
  variantsToDrafts,
  type VariantDraft,
} from './ProductVariantEditor';

type EditorTab = 'info' | 'variants' | 'images';

const emptyForm = (categoryId = 0): ProductPayload => ({
  name: '',
  categoryId,
  basePrice: 0,
  description: '',
  variants: [{ stockQuantity: 0 }],
  images: [],
});

interface ProductEditorModalProps {
  open: boolean;
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductEditorModal = ({
  open,
  product,
  categories,
  onClose,
  onSuccess,
}: ProductEditorModalProps) => {
  const isEdit = Boolean(product?.id);
  const [tab, setTab] = useState<EditorTab>('info');
  const [form, setForm] = useState<ProductPayload>(emptyForm());
  const [variantRows, setVariantRows] = useState<VariantDraft[]>(variantsToDrafts());
  const [images, setImages] = useState(product?.images ?? []);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab('info');
    setError(null);
    setPendingImages([]);

    if (product?.id) {
      setLoading(true);
      catalogService
        .getProductById(product.id)
        .then((res) => {
          const detail = res.data.data;
          if (!detail) return;
          setForm({
            name: detail.name,
            categoryId: detail.categoryId,
            basePrice: detail.basePrice,
            description: detail.description ?? '',
          });
          setVariantRows(variantsToDrafts(detail.variants));
          setImages(detail.images ?? []);
        })
        .catch(() => setError('Không thể tải chi tiết sản phẩm.'))
        .finally(() => setLoading(false));
      return;
    }

    setForm(emptyForm(categories[0]?.id ?? 0));
    setVariantRows(variantsToDrafts());
    setImages([]);
  }, [open, product?.id, categories]);

  const canSubmit = useMemo(
    () => Boolean(form.name.trim() && form.categoryId && (form.basePrice ?? 0) > 0),
    [form],
  );

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);

    try {
      const payload: ProductPayload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        basePrice: Number(form.basePrice) || 0,
        description: form.description?.trim() || undefined,
        variants: draftsToPayload(variantRows, Number(form.basePrice) || 0),
      };

      if (isEdit && product?.id) {
        await catalogService.updateProduct(product.id, payload);
        onSuccess();
        onClose();
        return;
      }

      const res = await catalogService.createProduct(payload);
      const createdId = res.data.data?.id;
      if (createdId && pendingImages.length > 0) {
        for (let i = 0; i < pendingImages.length; i += 1) {
          await catalogService.uploadProductImage(createdId, pendingImages[i], i === 0);
        }
      }
      onSuccess();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const tabs: { id: EditorTab; label: string; icon: string }[] = [
    { id: 'info', label: 'Thông tin', icon: 'info' },
    { id: 'variants', label: 'Biến thể', icon: 'palette' },
    { id: 'images', label: 'Hình ảnh', icon: 'image' },
  ];

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
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            {isEdit ? (
              <p className="text-xs text-amber-700 mt-1">
                Lưu thông tin cơ bản sẽ gửi lại admin duyệt sản phẩm.
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant mt-1">
                Sản phẩm mới cần admin phê duyệt trước khi hiển thị.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex gap-2 border-b border-outline-variant px-5 py-3">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                tab === item.id
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="mb-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-surface-container" />
          ) : tab === 'info' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">Tên sản phẩm *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Ví dụ: Áo thun cotton 220gsm"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-on-surface">Danh mục *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, categoryId: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value={0}>Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-on-surface">Giá cơ bản (VND) *</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.basePrice || ''}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, basePrice: Number(e.target.value) || 0 }))
                    }
                    placeholder="120000"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  placeholder="Chất liệu, quy trình may, hướng dẫn chọn size..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
          ) : null}

          {!loading && tab === 'variants' ? (
            <ProductVariantEditor
              mode={isEdit ? 'edit' : 'create'}
              productId={product?.id}
              basePrice={Number(form.basePrice) || 0}
              rows={variantRows}
              onChange={setVariantRows}
              disabled={saving}
              onError={setError}
            />
          ) : null}

          {!loading && tab === 'images' ? (
            <ProductImageEditor
              productId={isEdit ? product?.id : undefined}
              images={images}
              pendingFiles={pendingImages}
              onImagesChange={setImages}
              onPendingFilesChange={setPendingImages}
              disabled={saving}
              onError={setError}
            />
          ) : null}
        </div>

        <div className="flex gap-3 border-t border-outline-variant px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-50"
          >
            Hủy
          </button>
          {tab === 'info' || !isEdit ? (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !canSubmit}
              className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : isEdit ? 'Lưu thông tin' : 'Tạo sản phẩm'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-white"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
