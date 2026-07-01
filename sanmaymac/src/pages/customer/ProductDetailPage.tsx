import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { catalogService, Product, ProductVariant, resolveCatalogAssetUrl } from '../../services/endpoints/catalogService';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { ApiResponse } from '../../types';
import { cacheKeys, cacheService } from '../../services/cache';

// ── Types ──────────────────────────────────────────────────────────────────
interface Review {
  id: number;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  imageUrls?: string[];
  reply?: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const resolveAssetUrl = resolveCatalogAssetUrl;

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return iso; }
};

// ── Skeleton ───────────────────────────────────────────────────────────────
const DetailSkeleton = () => (
  <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="aspect-square bg-surface-container rounded-2xl" />
      <div className="space-y-4 pt-4">
        <div className="h-6 bg-surface-container rounded w-1/3" />
        <div className="h-8 bg-surface-container rounded w-2/3" />
        <div className="h-16 bg-surface-container rounded" />
        <div className="h-12 bg-surface-container rounded" />
        <div className="h-12 bg-surface-container rounded" />
      </div>
    </div>
  </main>
);

// ── Main ───────────────────────────────────────────────────────────────────
export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const [mainImgIdx, setMainImgIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'desc' | 'spec' | 'review'>('desc');

  // Fetch product detail
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    catalogService.getProductById(productId)
      .then((res) => {
        const p = res.data.data;
        setProduct(p);
        setIsFavorite(!!p?.isFavorite);
        // Chọn variant đầu tiên mặc định
        if (p?.variants?.length) setSelectedVariant(p.variants[0]);
      })
      .catch(() => setError('Không tìm thấy sản phẩm này.'))
      .finally(() => setLoading(false));
  }, [productId]);

  // Fetch review summary
  useEffect(() => {
    if (!productId) return;
    api.get<ApiResponse<ReviewSummary>>(`/reviews/public/products/${productId}/summary`)
      .then((res) => setReviewSummary(res.data.data))
      .catch(() => {});
  }, [productId]);

  // Fetch reviews
  useEffect(() => {
    if (!productId) return;
    setLoadingReviews(true);
    api.get<ApiResponse<PageResponse<Review>>>(`/reviews/public/products/${productId}`, {
      params: { page: reviewPage, size: 5, sort: 'createdAt,desc' },
    })
      .then((res) => {
        const data = res.data.data;
        setReviews(data?.content ?? []);
        setReviewTotalPages(data?.totalPages ?? 0);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [productId, reviewPage]);

  if (loading) return <CustomerLayout><DetailSkeleton /></CustomerLayout>;

  if (error || !product) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">inventory_2</span>
          <h2 className="font-bold text-xl text-on-surface mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-on-surface-variant mb-6">{error}</p>
          <Link to="/products" className="btn-user-primary-md">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const images = product.images ?? [];
  const sortedImages = [...images].sort((a, b) => (b.isThumbnail ? 1 : 0) - (a.isThumbnail ? 1 : 0));
  const currentImg = resolveAssetUrl(sortedImages[mainImgIdx]?.imageUrl ?? '');

  // Group variants theo color và size
  const colors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean) as string[])];
  const sizes = [...new Set(product.variants?.map((v) => v.size).filter(Boolean) as string[])];

  const selectedColor = selectedVariant?.color ?? colors[0];
  const selectedSize = selectedVariant?.size ?? sizes[0];

  const findVariant = (color?: string, size?: string) =>
    product.variants?.find((v) => v.color === color && v.size === size) ?? null;

  const displayPrice = selectedVariant?.price ?? product.basePrice;
  const rating = reviewSummary?.averageRating ?? product.averageRating ?? 0;
  const reviewCount = reviewSummary?.totalReviews ?? product.reviewCount ?? 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (!selectedVariant) return;
    setAddingToCart(true);
    try {
      await addItem(selectedVariant.id, qty);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (!product) return;

    setTogglingFavorite(true);
    const nextFavorite = !isFavorite;

    try {
      if (nextFavorite) {
        await catalogService.addFavoriteProduct(product.id);
      } else {
        await catalogService.removeFavoriteProduct(product.id);
      }
      setIsFavorite(nextFavorite);
      setProduct((prev) => (prev ? { ...prev, isFavorite: nextFavorite } : prev));
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        cacheService.remove(cacheKeys.favoriteProducts(userId));
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể cập nhật danh sách yêu thích');
    } finally {
      setTogglingFavorite(false);
    }
  };

  return (
    <CustomerLayout>
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 flex-wrap">
          <Link to="/" className="text-on-surface-variant hover:text-secondary">Trang chủ</Link>
          <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
          <Link to="/products" className="text-on-surface-variant hover:text-secondary">Sản phẩm</Link>
          {product.categoryName && (
            <>
              <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
              <Link to={`/products?categoryId=${product.categoryId}`} className="text-on-surface-variant hover:text-secondary">
                {product.categoryName}
              </Link>
            </>
          )}
          <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
          <span className="text-secondary font-medium line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── LEFT: Images ── */}
          <div className="space-y-4">
            <div className="aspect-square bg-surface-container rounded-2xl overflow-hidden">
              {currentImg ? (
                <img src={currentImg} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-outline">image</span>
                </div>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {sortedImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setMainImgIdx(i)}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${mainImgIdx === i ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200 hover:border-orange-300'}`}
                  >
                    <img src={resolveAssetUrl(img.imageUrl)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="space-y-6">
            {/* Workshop link */}
            {product.workshopName && (
              <Link to={`/workshop/${product.workshopId}`} className="inline-flex items-center gap-2 text-sm text-secondary hover:underline">
                <span className="material-symbols-outlined text-sm">store</span>
                {product.workshopName}
              </Link>
            )}

            <div>
              <h1 className="font-headline-lg text-on-surface">{product.name}</h1>
              {rating > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-amber-500 text-base"
                        style={{ fontVariationSettings: `'FILL' ${s <= Math.round(rating) ? 1 : 0}` }}>star</span>
                    ))}
                  </div>
                  <span className="font-bold text-on-surface">{Number(rating).toFixed(1)}</span>
                  <span className="text-on-surface-variant text-sm">({reviewCount} đánh giá)</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="p-5 rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
              <p className="text-xs font-medium text-orange-700/80 mb-1">Giá / cái</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-orange-700 to-orange-500 bg-clip-text text-transparent">
                {fmt(displayPrice)}
              </p>
              {selectedVariant && selectedVariant.stockQuantity > 0 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Còn {selectedVariant.stockQuantity} cái trong kho
                </p>
              )}
            </div>

            {/* Color variants */}
            {colors.length > 0 && (
              <div>
                <label className="text-sm text-on-surface-variant block mb-3">
                  Màu sắc: <span className="text-on-surface font-bold">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedVariant(findVariant(color, selectedSize))}
                      className={`px-4 py-2.5 text-sm ${
                        selectedColor === color ? 'btn-user-chip-active' : 'btn-user-chip'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size variants */}
            {sizes.length > 0 && (
              <div>
                <label className="text-sm text-on-surface-variant block mb-3">
                  Kích cỡ: <span className="text-on-surface font-bold">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedVariant(findVariant(selectedColor, size))}
                      className={`min-w-[3rem] px-4 py-2.5 text-sm ${
                        selectedSize === size ? 'btn-user-chip-active scale-105' : 'btn-user-chip'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm text-on-surface-variant block mb-3">Số lượng</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-5 py-3 text-orange-700 font-bold transition-colors hover:bg-orange-50"
                  >-</button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center py-3 font-bold text-slate-800 border-x-2 border-slate-200 outline-none"
                    min={1}
                  />
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-5 py-3 text-orange-700 font-bold transition-colors hover:bg-orange-50"
                  >+</button>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tổng dự kiến</p>
                  <p className="font-extrabold text-orange-600">{fmt(displayPrice * qty)}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedVariant}
                className={`flex-1 ${addedToCart ? 'btn-user-success h-14 w-full px-6' : 'btn-user-primary-lg'}`}
              >
                <span className="material-symbols-outlined">
                  {addedToCart ? 'check_circle' : addingToCart ? 'hourglass_empty' : 'add_shopping_cart'}
                </span>
                {addedToCart ? 'Đã thêm vào giỏ!' : addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </button>
              {addedToCart && (
                <Link
                  to="/cart"
                  className="btn-user-outline-md h-14"
                >
                  Xem giỏ
                </Link>
              )}
              <button
                onClick={handleToggleFavorite}
                disabled={togglingFavorite}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all disabled:opacity-60 ${
                  isFavorite
                    ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:from-rose-600 hover:to-pink-600'
                    : 'border-2 border-slate-200 bg-white text-slate-500 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
              >
                <span className="material-symbols-outlined">
                  {togglingFavorite ? 'hourglass_empty' : isFavorite ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            </div>

            {/* Trust badge */}
            <div className="p-4 bg-surface-container rounded-xl flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <div>
                <p className="font-medium text-on-surface text-sm">Xưởng đã được xác thực năng lực</p>
                <p className="text-xs text-on-surface-variant">Đảm bảo chất lượng bởi Bách Xưởng</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-12 border-t border-outline-variant pt-8">
          <div className="flex gap-6 mb-8">
            {([
              ['desc', 'Mô tả'],
              ['spec', 'Thông số'],
              ['review', `Đánh giá${reviewCount > 0 ? ` (${reviewCount})` : ''}`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={tab === key ? 'btn-user-tab-active' : 'btn-user-tab'}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Description */}
          {tab === 'desc' && (
            <div className="max-w-2xl">
              {product.description ? (
                <p className="text-on-surface-variant font-body-md leading-relaxed">{product.description}</p>
              ) : (
                <p className="text-on-surface-variant italic">Chưa có mô tả sản phẩm.</p>
              )}
            </div>
          )}

          {/* Specs — từ variants */}
          {tab === 'spec' && (
            <div className="max-w-lg">
              {[
                { label: 'Danh mục', value: product.categoryName },
                { label: 'Xưởng sản xuất', value: product.workshopName },
                { label: 'Giá cơ bản', value: fmt(product.basePrice) },
                { label: 'Số biến thể', value: product.variants?.length ? `${product.variants.length} biến thể` : null },
                { label: 'Màu sắc có sẵn', value: colors.length ? colors.join(', ') : null },
                { label: 'Kích cỡ có sẵn', value: sizes.length ? sizes.join(', ') : null },
              ]
                .filter((s) => s.value)
                .map((s) => (
                  <div key={s.label} className="flex py-3 border-b border-outline-variant">
                    <span className="w-44 text-sm text-on-surface-variant font-medium flex-shrink-0">{s.label}</span>
                    <span className="text-sm text-on-surface">{s.value}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Reviews */}
          {tab === 'review' && (
            <div className="max-w-2xl space-y-6">
              {/* Summary */}
              {reviewSummary && reviewSummary.totalReviews > 0 && (
                <div className="flex items-center gap-6 p-5 bg-surface-container-lowest border border-outline-variant rounded-xl">
                  <div className="text-center">
                    <p className="text-5xl font-extrabold text-on-surface">{Number(reviewSummary.averageRating).toFixed(1)}</p>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-amber-500 text-sm"
                          style={{ fontVariationSettings: `'FILL' ${s <= Math.round(reviewSummary.averageRating) ? 1 : 0}` }}>star</span>
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{reviewSummary.totalReviews} đánh giá</p>
                  </div>
                </div>
              )}

              {loadingReviews ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 bg-surface-container rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-outline mb-3">rate_review</span>
                  <p className="text-on-surface-variant">Chưa có đánh giá nào.</p>
                </div>
              ) : (
                <>
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/10 flex items-center justify-center flex-shrink-0">
                          {r.customerAvatar ? (
                            <img src={resolveAssetUrl(r.customerAvatar)} alt={r.customerName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-secondary font-bold text-sm">{r.customerName?.[0]?.toUpperCase() ?? '?'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-on-surface text-sm">{r.customerName}</p>
                          <p className="text-xs text-on-surface-variant">{formatDate(r.createdAt)}</p>
                        </div>
                        <div className="flex flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className="material-symbols-outlined text-amber-500 text-sm"
                              style={{ fontVariationSettings: `'FILL' ${s <= r.rating ? 1 : 0}` }}>star</span>
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-on-surface-variant text-sm leading-relaxed">{r.comment}</p>}
                      {r.imageUrls && r.imageUrls.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {r.imageUrls.map((url, i) => (
                            <img key={i} src={resolveAssetUrl(url)} alt="" className="w-16 h-16 rounded-lg object-cover border border-outline-variant" />
                          ))}
                        </div>
                      )}
                      {r.reply && (
                        <div className="mt-3 pl-4 border-l-2 border-secondary/30 bg-secondary/5 rounded-r-lg p-3">
                          <p className="text-xs font-bold text-secondary mb-1">Phản hồi từ xưởng</p>
                          <p className="text-sm text-on-surface-variant">{r.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {reviewTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                        disabled={reviewPage === 0}
                        className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container disabled:opacity-40 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      <span className="text-sm text-on-surface-variant">Trang {reviewPage + 1} / {reviewTotalPages}</span>
                      <button
                        onClick={() => setReviewPage((p) => Math.min(reviewTotalPages - 1, p + 1))}
                        disabled={reviewPage >= reviewTotalPages - 1}
                        className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container disabled:opacity-40 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </CustomerLayout>
  );
};
