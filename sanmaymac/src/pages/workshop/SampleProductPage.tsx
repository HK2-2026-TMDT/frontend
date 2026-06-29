import { useEffect, useMemo, useState } from 'react';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import {
  catalogService,
  type Category,
  type Product,
  type ProductPayload,
} from '../../services/endpoints/catalogService';
import { formatWorkshopCurrency, formatWorkshopDate } from '../../utils/workshopUi';

const emptyForm = (categoryId = 0): ProductPayload => ({
  name: '',
  categoryId,
  basePrice: 0,
  description: '',
  variants: [{ stockQuantity: 0 }],
  images: [],
});

const getProductThumbnail = (product: Product) =>
  product.images?.find((img) => img.isThumbnail)?.imageUrl ?? product.images?.[0]?.imageUrl;

const getTotalStock = (product: Product) =>
  product.variants?.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0) ?? 0;

const getApprovalBadge = (status?: Product['approvalStatus']) => {
  switch (status) {
    case 'APPROVED':
      return { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' };
    case 'REJECTED':
      return { label: 'Từ chối', className: 'bg-red-100 text-red-800' };
    default:
      return { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-800' };
  }
};

export const SampleProductPage = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductPayload>(emptyForm());

  const stats = useMemo(() => {
    const approved = items.filter((item) => item.approvalStatus === 'APPROVED').length;
    const pending = items.filter((item) => item.approvalStatus === 'PENDING' || !item.approvalStatus).length;
    const visible = items.filter((item) => item.approvalStatus === 'APPROVED' && item.isVisible !== false).length;
    return { total: items.length, approved, pending, visible };
  }, [items]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        catalogService.getMyProducts({ page: 0, size: 100, sort: 'createdAt,desc' }),
        catalogService.getCategories(),
      ]);
      setItems(productsRes.data.data?.content ?? []);
      const loadedCategories = categoriesRes.data.data ?? [];
      setCategories(loadedCategories);
      if (loadedCategories.length > 0) {
        setForm((current) =>
          current.categoryId ? current : { ...current, categoryId: loadedCategories[0].id },
        );
      }
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm(categories[0]?.id ?? 0));
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.categoryId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await catalogService.createProduct({
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        basePrice: Number(form.basePrice) || 0,
        variants: [{ stockQuantity: Number(form.variants?.[0]?.stockQuantity) || 0 }],
      });
      setSuccessMessage('Đã gửi sản phẩm chờ admin duyệt.');
      closeForm();
      await loadProducts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể thêm sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await catalogService.deleteProduct(id);
      setSuccessMessage('Đã xóa sản phẩm.');
      await loadProducts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Không thể xóa sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (item: Product) => {
    if (item.approvalStatus !== 'APPROVED') {
      setError('Sản phẩm phải được admin duyệt trước khi hiển thị.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const next = !Boolean(item.isVisible ?? true);
      await catalogService.updateProductVisibility(item.id, next);
      setItems((current) => current.map((p) => (p.id === item.id ? { ...p, isVisible: next } : p)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = Boolean(form.name.trim() && form.categoryId && form.basePrice > 0);

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <WorkshopPageHeader
          title="Quản lý sản phẩm"
          description="Sản phẩm mới cần được admin phê duyệt trước khi hiển thị trên cửa hàng."
          actions={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Thêm sản phẩm
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: 'Tổng sản phẩm', value: stats.total, icon: 'inventory_2' },
            { label: 'Chờ duyệt', value: stats.pending, icon: 'hourglass_top' },
            { label: 'Đã duyệt', value: stats.approved, icon: 'verified' },
            { label: 'Đang hiển thị', value: stats.visible, icon: 'visibility' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-outline-variant bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-on-surface-variant">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-on-surface">{loading ? '…' : stat.value}</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-secondary">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}
        {successMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const thumbnail = getProductThumbnail(item);
              const isHidden = item.isVisible === false;
              const approval = getApprovalBadge(item.approvalStatus);
              const canToggleVisibility = item.approvalStatus === 'APPROVED';

              return (
                <article
                  key={item.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-shadow hover:shadow-md ${
                    isHidden ? 'border-outline-variant opacity-80' : 'border-outline-variant'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-surface-container">
                    {thumbnail ? (
                      <img src={thumbnail} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl opacity-40">image</span>
                      </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${approval.className}`}>
                      {approval.label}
                    </span>
                    {item.approvalStatus === 'APPROVED' ? (
                      <span
                        className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isHidden ? 'bg-slate-100 text-slate-700' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isHidden ? 'Đang ẩn' : 'Hiển thị'}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-secondary">{item.categoryName ?? 'Danh mục'}</p>
                      <h3 className="line-clamp-2 text-base font-bold text-on-surface">{item.name}</h3>
                      {item.description ? (
                        <p className="line-clamp-2 text-sm text-on-surface-variant">{item.description}</p>
                      ) : null}
                      {item.approvalStatus === 'REJECTED' && item.adminNote ? (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                          Lý do từ chối: {item.adminNote}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <p className="text-lg font-bold text-on-surface">{formatWorkshopCurrency(item.basePrice)}</p>
                          <p className="text-xs text-on-surface-variant">Tồn kho: {getTotalStock(item)}</p>
                        </div>
                        <p className="text-xs text-on-surface-variant">{formatWorkshopDate(item.createdAt)}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleVisibility(item)}
                          disabled={saving || !canToggleVisibility}
                          title={canToggleVisibility ? undefined : 'Chờ admin duyệt sản phẩm'}
                          className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {canToggleVisibility ? (isHidden ? 'Hiện sản phẩm' : 'Ẩn sản phẩm') : 'Chờ duyệt'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteProduct(item.id)}
                          disabled={saving}
                          className="rounded-lg border border-error/30 px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-6 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline">inventory_2</span>
            <h3 className="mt-4 text-lg font-bold text-on-surface">Chưa có sản phẩm nào</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Thêm sản phẩm đầu tiên — admin sẽ duyệt trước khi hiển thị cho khách hàng.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Thêm sản phẩm
            </button>
          </div>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            onClick={closeForm}
            onKeyDown={(e) => e.key === 'Escape' && closeForm()}
            role="button"
            tabIndex={-1}
            aria-label="Đóng"
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <h2 className="text-lg font-bold text-on-surface">Thêm sản phẩm mới</h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">Tên sản phẩm *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Ví dụ: Áo thun cotton 220gsm"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-on-surface">Danh mục *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((c) => ({ ...c, categoryId: Number(e.target.value) }))}
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
                  <label className="text-sm font-medium text-on-surface">Tồn kho</label>
                  <input
                    type="number"
                    min={0}
                    value={form.variants?.[0]?.stockQuantity ?? 0}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        variants: [{ stockQuantity: Number(e.target.value) || 0 }],
                      }))
                    }
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">Giá bán (VND) *</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.basePrice || ''}
                  onChange={(e) => setForm((c) => ({ ...c, basePrice: Number(e.target.value) || 0 }))}
                  placeholder="120000"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  placeholder="Chất liệu, size, ghi chú sản xuất..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-outline-variant px-5 py-4">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold text-on-surface hover:bg-surface-container"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void saveProduct()}
                disabled={saving || !canSubmit}
                className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Đang lưu…' : 'Lưu sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </WorkshopLayout>
  );
};
