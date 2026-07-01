import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { workshopService, PublicWorkshop, PortfolioItem } from '../../services/endpoints/workshopService';
import { catalogService, Product, getProductThumbnailUrl } from '../../services/endpoints/catalogService';
import api from '../../services/api';
import { ApiResponse } from '../../types';

// ── Types ──────────────────────────────────────────────────────────────────
interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

interface Review {
  id: number;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
  imageUrls?: string[];
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const getThumbnail = (product: Product) => getProductThumbnailUrl(product);

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return iso; }
};

// ── Skeletons ──────────────────────────────────────────────────────────────
const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-surface-container" />
    <div className="max-w-[1400px] mx-auto px-4 md:px-8">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl -mt-16 p-6 mb-8">
        <div className="flex gap-5">
          <div className="w-20 h-20 bg-surface-container rounded-2xl -mt-10" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-5 bg-surface-container rounded w-1/3" />
            <div className="h-4 bg-surface-container rounded w-1/2" />
            <div className="h-4 bg-surface-container rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
export const WorkshopProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const workshopId = Number(id);

  const [workshop, setWorkshop] = useState<PublicWorkshop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);

  const [loadingWorkshop, setLoadingWorkshop] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<'products' | 'about' | 'reviews'>('products');

  // Fetch workshop detail
  useEffect(() => {
    if (!workshopId) return;
    setLoadingWorkshop(true);
    workshopService
      .getPublicWorkshopById(workshopId)
      .then((res) => setWorkshop(res.data.data))
      .catch(() => setError('Không tìm thấy xưởng này.'))
      .finally(() => setLoadingWorkshop(false));
  }, [workshopId]);

  // Fetch products của xưởng
  useEffect(() => {
    if (!workshopId) return;
    setLoadingProducts(true);
    catalogService
      .getProducts({ workshopId, page: 0, size: 6, sort: 'createdAt,desc' })
      .then((res) => setProducts(res.data.data?.content ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [workshopId]);

  // Fetch portfolio
  useEffect(() => {
    if (!workshopId) return;
    setLoadingPortfolio(true);
    workshopService
      .getPublicWorkshopPortfolio(workshopId)
      .then((res) => setPortfolio(res.data.data ?? []))
      .catch(() => setPortfolio([]))
      .finally(() => setLoadingPortfolio(false));
  }, [workshopId]);

  // Fetch review summary
  useEffect(() => {
    if (!workshopId) return;
    api
      .get<ApiResponse<ReviewSummary>>(`/reviews/public/workshops/${workshopId}/summary`)
      .then((res) => setReviewSummary(res.data.data))
      .catch(() => {});
  }, [workshopId]);

  // Fetch reviews (khi chuyển tab hoặc đổi trang)
  useEffect(() => {
    if (!workshopId) return;
    setLoadingReviews(true);
    api
      .get<ApiResponse<PageResponse<Review>>>(`/reviews/public/workshops/${workshopId}`, {
        params: { page: reviewPage, size: 5, sort: 'createdAt,desc' },
      })
      .then((res) => {
        const data = res.data.data;
        setReviews(data?.content ?? []);
        setReviewTotalPages(data?.totalPages ?? 0);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [workshopId, reviewPage]);

  if (loadingWorkshop) return <CustomerLayout><ProfileSkeleton /></CustomerLayout>;

  if (error || !workshop) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">factory</span>
          <h2 className="font-bold text-xl text-on-surface mb-2">Không tìm thấy xưởng</h2>
          <p className="text-on-surface-variant mb-6">{error ?? 'Xưởng này không tồn tại hoặc đã ngừng hoạt động.'}</p>
          <Link to="/workshop-directory" className="btn-user-primary-md">
            Quay lại danh sách xưởng
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const initials = workshop.shopName?.slice(0, 2).toUpperCase() ?? 'WS';
  const profileImage = workshop.avatarUrl ?? workshop.logoUrl;
  const rating = reviewSummary?.averageRating ?? workshop.ratingAvg ?? 0;
  const reviewCount = reviewSummary?.totalReviews ?? 0;

  return (
    <CustomerLayout>
      {/* ── Cover ── */}
      <div className="relative h-64 overflow-hidden bg-primary">
        {workshop.avatarUrl ? (
          <img src={workshop.avatarUrl} alt={workshop.shopName} className="w-full h-full object-cover opacity-60" />
        ) : workshop.logoUrl ? (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary opacity-90 flex items-center justify-center">
            <img src={workshop.logoUrl} alt={workshop.shopName} className="max-h-32 max-w-[280px] object-contain drop-shadow-lg" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-0">

        {/* ── Profile Header ── */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl -mt-16 relative z-10 p-6 shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden flex-shrink-0 -mt-10 sm:-mt-12 bg-primary flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt={workshop.shopName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-extrabold">{initials}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-headline-lg text-on-surface">{workshop.shopName}</h1>
                {workshop.isVerified && (
                  <span className="flex items-center gap-1 bg-secondary/10 text-secondary text-xs font-bold px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Đã xác thực
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant text-sm truncate">{workshop.fullName}</p>
              {workshop.workshopAddress && (
                <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {workshop.workshopAddress}
                </p>
              )}

              <div className="flex flex-wrap gap-5 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-amber-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-bold">{rating ? Number(rating).toFixed(1) : '—'}</span>
                  <span className="text-on-surface-variant">({reviewCount} đánh giá)</span>
                </div>
                {workshop.productionCapacity > 0 && (
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                    {workshop.productionCapacity.toLocaleString()} sp/tháng
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Link
                to="/create-tender"
                className="btn-user-primary-sm"
              >
                <span className="material-symbols-outlined text-sm">request_quote</span>
                Gửi yêu cầu
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: 'star', label: 'Đánh giá TB', value: rating ? Number(rating).toFixed(1) : '—', color: 'text-amber-500' },
            { icon: 'rate_review', label: 'Lượt đánh giá', value: reviewCount.toLocaleString(), color: 'text-secondary' },
            { icon: 'precision_manufacturing', label: 'Năng lực/tháng', value: workshop.productionCapacity > 0 ? `${workshop.productionCapacity.toLocaleString()} sp` : '—', color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
              <span className={`material-symbols-outlined text-2xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="font-bold text-on-surface mt-1">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-6 border-b border-outline-variant mb-8">
          {([
            ['products', 'Sản phẩm'],
            ['about', 'Giới thiệu'],
            ['reviews', `Đánh giá${reviewCount > 0 ? ` (${reviewCount})` : ''}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-3 font-medium text-sm border-b-2 transition-all ${
                tab === key ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Products ── */}
        {tab === 'products' && (
          <div className="mb-12">
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 bg-surface-container rounded-xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-3">inventory_2</span>
                <p className="text-on-surface-variant">Xưởng chưa có sản phẩm nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg hover:border-secondary/40 transition-all group block"
                  >
                    <div className="h-44 overflow-hidden bg-surface-container">
                      {getThumbnail(p) ? (
                        <img src={getThumbnail(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-outline">image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-on-surface line-clamp-2 group-hover:text-secondary transition-colors">{p.name}</h3>
                      {p.categoryName && <p className="text-xs text-on-surface-variant mt-0.5">{p.categoryName}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-secondary">{fmt(p.basePrice)}/cái</span>
                        {(p.averageRating ?? 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-xs font-bold">{Number(p.averageRating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: About ── */}
        {tab === 'about' && (
          <div className="max-w-4xl mb-12 space-y-8">
            {workshop.description ? (
              <p className="text-on-surface-variant font-body-md leading-relaxed">{workshop.description}</p>
            ) : (
              <p className="text-on-surface-variant italic">Xưởng chưa cập nhật thông tin giới thiệu.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workshop.workshopAddress && (
                <div className="flex items-start gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
                  <span className="material-symbols-outlined text-secondary">location_on</span>
                  <div>
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Địa chỉ</p>
                    <p className="text-sm text-on-surface">{workshop.workshopAddress}</p>
                  </div>
                </div>
              )}
              {workshop.productionCapacity > 0 && (
                <div className="flex items-start gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
                  <span className="material-symbols-outlined text-secondary">precision_manufacturing</span>
                  <div>
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Năng lực sản xuất</p>
                    <p className="text-sm text-on-surface">{workshop.productionCapacity.toLocaleString()} sản phẩm/tháng</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="font-headline-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">collections</span>
                Portfolio sản phẩm
              </h2>
              {loadingPortfolio ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-56 bg-surface-container rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : portfolio.length === 0 ? (
                <p className="text-on-surface-variant italic">Xưởng chưa cập nhật portfolio.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((item) => (
                    <article
                      key={item.id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[4/3] bg-surface-container overflow-hidden">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-on-surface text-sm mb-1">{item.title}</h3>
                        {item.description && (
                          <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-3">{item.description}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Reviews ── */}
        {tab === 'reviews' && (
          <div className="max-w-2xl mb-12">
            {/* Summary */}
            {reviewSummary && reviewSummary.totalReviews > 0 && (
              <div className="flex items-center gap-6 p-5 bg-surface-container-lowest border border-outline-variant rounded-xl mb-6">
                <div className="text-center">
                  <p className="text-5xl font-extrabold text-on-surface">{Number(reviewSummary.averageRating).toFixed(1)}</p>
                  <div className="flex justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-amber-500 text-sm"
                        style={{ fontVariationSettings: `'FILL' ${s <= Math.round(reviewSummary.averageRating) ? 1 : 0}` }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{reviewSummary.totalReviews} đánh giá</p>
                </div>
              </div>
            )}

            {/* Review list */}
            {loadingReviews ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 bg-surface-container rounded-xl animate-pulse" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-3">rate_review</span>
                <p className="text-on-surface-variant">Chưa có đánh giá nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        {r.customerAvatar ? (
                          <img src={r.customerAvatar} alt={r.customerName} className="w-full h-full object-cover" />
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
                            style={{ fontVariationSettings: `'FILL' ${s <= r.rating ? 1 : 0}` }}>
                            star
                          </span>
                        ))}
                      </div>
                    </div>

                    {r.comment && <p className="text-on-surface-variant text-sm leading-relaxed">{r.comment}</p>}

                    {r.imageUrls && r.imageUrls.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {r.imageUrls.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-outline-variant" />
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

                {/* Review pagination */}
                {reviewTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                      disabled={reviewPage === 0}
                      className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container disabled:opacity-40 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="text-sm text-on-surface-variant">
                      Trang {reviewPage + 1} / {reviewTotalPages}
                    </span>
                    <button
                      onClick={() => setReviewPage((p) => Math.min(reviewTotalPages - 1, p + 1))}
                      disabled={reviewPage >= reviewTotalPages - 1}
                      className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container disabled:opacity-40 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </CustomerLayout>
  );
};
