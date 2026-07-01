import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { catalogService, Product, Category, getProductThumbnailUrl } from '../../services/endpoints/catalogService';
import { cacheKeys, cacheService, cacheTtl } from '../../services/cache';

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'createdAt,desc' },
  { label: 'Giá tăng dần', value: 'basePrice,asc' },
  { label: 'Giá giảm dần', value: 'basePrice,desc' },
  { label: 'Đánh giá cao nhất', value: 'averageRating,desc' },
];

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const getThumbnail = (product: Product) => getProductThumbnailUrl(product);

const ProductSkeleton = () => (
  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden animate-pulse">
    <div className="h-52 bg-surface-container" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-surface-container rounded w-3/4" />
      <div className="h-3 bg-surface-container rounded w-1/2" />
      <div className="h-4 bg-surface-container rounded w-1/3 mt-3" />
    </div>
  </div>
);

export const ProductCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : null
  );
  const [sort, setSort] = useState('createdAt,desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => { setPage(0); }, [selectedCategoryId, sort, minPrice, maxPrice]);

  // Fetch categories
  useEffect(() => {
    const cachedCategories = cacheService.get<Category[]>(cacheKeys.categories);
    if (cachedCategories) {
      setCategories(cachedCategories);
      return;
    }

    catalogService.getCategories()
      .then((res) => {
        const categories = res.data.data ?? [];
        setCategories(categories);
        cacheService.set(cacheKeys.categories, categories, cacheTtl.categories);
      })
      .catch(() => {});
  }, []);

  // Fetch products
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    catalogService.getProducts({
      keyword: debouncedSearch || undefined,
      categoryId: selectedCategoryId ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page,
      size: PAGE_SIZE,
      sort,
    })
      .then((res) => {
        const data = res.data.data;
        setProducts(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 0);
        setTotalElements(data?.totalElements ?? 0);
      })
      .catch(() => setError('Không thể tải sản phẩm. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, selectedCategoryId, sort, minPrice, maxPrice, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleCategoryChange = (id: number | null) => {
    setSelectedCategoryId(id);
    if (id) setSearchParams({ categoryId: String(id) });
    else setSearchParams({});
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategoryId(null);
    setSort('createdAt,desc');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  const hasFilters = debouncedSearch || selectedCategoryId || minPrice || maxPrice;

  return (
    <CustomerLayout>
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-headline-lg text-on-surface mb-2">Danh mục Sản phẩm</h1>
          <p className="text-on-surface-variant font-body-md">Mua sắm sản phẩm may mặc chất lượng từ các xưởng uy tín.</p>
        </div>

        {/* ── Filters ── */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
                placeholder="Tìm sản phẩm..."
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface min-w-[180px]"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Price range */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-on-surface-variant font-medium">Giá:</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Từ"
              className="w-28 px-3 py-2 border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary bg-surface"
            />
            <span className="text-on-surface-variant">—</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Đến"
              className="w-28 px-3 py-2 border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary bg-surface"
            />
            <span className="text-xs text-on-surface-variant">₫</span>
            {hasFilters && (
              <button onClick={clearFilters} className="ml-auto text-sm text-secondary hover:underline">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── Category pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-8">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              !selectedCategoryId ? 'btn-user-chip-active px-4 py-2' : 'btn-user-chip px-4 py-2'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategoryId === cat.id ? 'btn-user-chip-active px-4 py-2' : 'btn-user-chip px-4 py-2'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Result count ── */}
        {!loading && !error && (
          <p className="text-sm text-on-surface-variant mb-6">
            {totalElements > 0 ? `${totalElements.toLocaleString()} sản phẩm` : 'Không tìm thấy sản phẩm nào'}
          </p>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">error_outline</span>
            <p className="text-on-surface-variant mb-4">{error}</p>
            <button onClick={fetchProducts} className="btn-user-primary-sm">
              Thử lại
            </button>
          </div>
        )}

        {/* ── Product Grid ── */}
        {!error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductSkeleton key={i} />)
                : products.length === 0
                ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4">inventory_2</span>
                    <p className="text-on-surface-variant">Không tìm thấy sản phẩm phù hợp.</p>
                  </div>
                )
                : products.map((product) => (
                  <div key={product.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg hover:border-secondary/40 transition-all group">
                    <div className="relative h-52 overflow-hidden bg-surface-container">
                      {getThumbnail(product) ? (
                        <img
                          src={getThumbnail(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-outline">image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-medium text-on-surface text-sm line-clamp-2 hover:text-secondary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      {product.workshopName && (
                        <p className="text-xs text-on-surface-variant mt-1 truncate">By {product.workshopName}</p>
                      )}
                      {(product.averageRating ?? 0) > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-xs font-bold text-on-surface">{Number(product.averageRating).toFixed(1)}</span>
                          <span className="text-xs text-on-surface-variant">({product.reviewCount ?? 0})</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-secondary text-sm">{fmt(product.basePrice)}/cái</span>
                        <Link
                          to={`/product/${product.id}`}
                          className="p-2 bg-secondary-fixed rounded-full hover:bg-secondary text-secondary hover:text-white transition-all"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* ── Pagination ── */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                  .reduce<(number | '...')[]>((acc, i, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (i as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(i);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`e-${idx}`} className="px-2 text-on-surface-variant">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={`w-10 h-10 text-sm font-medium transition-all ${page === item ? 'btn-user-chip-active' : 'btn-user-chip'}`}
                      >
                        {(item as number) + 1}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </CustomerLayout>
  );
};
