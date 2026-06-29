import { useEffect, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  adminProductService,
  type AdminProductReview,
  type ProductApprovalStatus,
} from '../../services/endpoints/adminProductService';

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value ?? 0);

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN');
};

const statusLabel: Record<ProductApprovalStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const statusClass: Record<ProductApprovalStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export const AdminProductAuditPage = () => {
  const [activeTab, setActiveTab] = useState<ProductApprovalStatus>('PENDING');
  const [products, setProducts] = useState<AdminProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [noteById, setNoteById] = useState<Record<number, string>>({});

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminProductService.listProducts({
        status: activeTab,
        page: 0,
        size: 200,
        sort: 'createdAt,desc',
      });
      setProducts(response.data.data?.content ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách sản phẩm.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [activeTab]);

  const reviewProduct = async (productId: number, approved: boolean) => {
    setSavingId(productId);
    setError(null);
    try {
      await adminProductService.reviewProduct(productId, approved, noteById[productId]?.trim() || undefined);
      await loadProducts();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Không thể cập nhật trạng thái duyệt.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="font-headline-md text-3xl text-slate-900">Kiểm duyệt sản phẩm</h1>
          <p className="mt-1 font-body-md text-slate-500">
            Phê duyệt sản phẩm xưởng đăng trước khi hiển thị trên cửa hàng.
          </p>
        </header>

        <div className="inline-flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
          {(
            [
              { id: 'PENDING' as const, label: 'Chờ duyệt' },
              { id: 'APPROVED' as const, label: 'Đã duyệt' },
              { id: 'REJECTED' as const, label: 'Từ chối' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-6 py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : products.length ? (
            products.map((product) => (
              <article
                key={product.id}
                className="group flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-primary md:flex-row"
              >
                <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 md:w-48">
                  {product.thumbnailUrl ? (
                    <img src={product.thumbnailUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      SP-{product.id}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusClass[product.approvalStatus]}`}
                    >
                      {statusLabel[product.approvalStatus]}
                    </span>
                    {product.isVisible ? (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                        Đang hiển thị
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="mb-1 text-xl font-bold text-slate-900">{product.name}</h3>
                    <p className="text-sm text-slate-500">
                      Xưởng: <span className="font-semibold text-slate-700">{product.workshopName ?? `#${product.workshopId}`}</span>
                      {' · '}
                      Danh mục: {product.categoryName ?? '—'}
                      {' · '}
                      {formatCurrency(product.basePrice)}
                      {' · '}
                      {formatDate(product.createdAt)}
                    </p>
                    {product.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description}</p>
                    ) : null}
                    {product.adminNote ? (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        Ghi chú admin: {product.adminNote}
                      </p>
                    ) : null}
                  </div>

                  {activeTab === 'PENDING' ? (
                    <div className="mt-auto space-y-3">
                      <input
                        type="text"
                        value={noteById[product.id] ?? ''}
                        onChange={(event) =>
                          setNoteById((current) => ({ ...current, [product.id]: event.target.value }))
                        }
                        placeholder="Ghi chú (tuỳ chọn)"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={savingId === product.id}
                          onClick={() => void reviewProduct(product.id, true)}
                          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {savingId === product.id ? 'Đang lưu…' : 'Phê duyệt'}
                        </button>
                        <button
                          type="button"
                          disabled={savingId === product.id}
                          onClick={() => void reviewProduct(product.id, false)}
                          className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Không có sản phẩm trong tab này.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
