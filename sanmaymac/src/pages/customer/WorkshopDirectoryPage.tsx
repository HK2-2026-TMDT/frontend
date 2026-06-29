import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { workshopService, PublicWorkshop } from '../../services/endpoints/workshopService';

const SORT_OPTIONS = [
  { label: 'Đánh giá cao nhất', value: 'ratingAvg,desc' },
  { label: 'Mới nhất', value: 'createdAt,desc' },
  { label: 'Năng lực cao nhất', value: 'productionCapacity,desc' },
];

const WorkshopSkeleton = () => (
  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden animate-pulse">
    <div className="h-48 bg-surface-container" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-surface-container rounded w-3/4" />
      <div className="h-3 bg-surface-container rounded w-1/2" />
      <div className="h-3 bg-surface-container rounded w-2/3" />
    </div>
  </div>
);

export const WorkshopDirectoryPage = () => {
  const [workshops, setWorkshops] = useState<PublicWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('ratingAvg,desc');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 12;

  // Debounce search 400ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Reset page khi filter thay đổi
  useEffect(() => { setPage(0); }, [verifiedOnly, sort]);

  const fetchWorkshops = useCallback(() => {
    setLoading(true);
    setError(null);
    workshopService
      .getPublicWorkshops({
        keyword: debouncedSearch || undefined,
        verifiedOnly: verifiedOnly || undefined,
        page,
        size: PAGE_SIZE,
        sort,
      })
      .then((res) => {
        const data = res.data.data;
        setWorkshops(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 0);
        setTotalElements(data?.totalElements ?? 0);
      })
      .catch(() => setError('Không thể tải danh sách xưởng. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, verifiedOnly, sort, page]);

  useEffect(() => { fetchWorkshops(); }, [fetchWorkshops]);

  return (
    <CustomerLayout>
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="font-headline-lg text-on-surface mb-2">Danh bạ Xưởng Gia Công</h1>
          <p className="text-on-surface-variant font-body-md">
            Khám phá hàng nghìn xưởng may đã được xác thực năng lực và chất lượng.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
                placeholder="Tìm xưởng theo tên, địa chỉ..."
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface min-w-[200px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex items-center gap-1 border border-outline-variant rounded-xl p-1 bg-surface">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'btn-user-chip-active' : 'btn-user-chip'}`}
                title="Dạng lưới"
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'btn-user-chip-active' : 'btn-user-chip'}`}
                title="Dạng danh sách"
              >
                <span className="material-symbols-outlined text-sm">view_list</span>
              </button>
            </div>
          </div>

          {/* Verified filter */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                verifiedOnly
                  ? 'btn-user-chip-active flex items-center gap-2 px-4 py-2 rounded-full text-sm'
                  : 'btn-user-chip flex items-center gap-2 px-4 py-2 rounded-full text-sm'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: verifiedOnly ? "'FILL' 1" : "'FILL' 0" }}>
                verified
              </span>
              Chỉ xưởng đã xác thực
            </button>

            {(debouncedSearch || verifiedOnly) && (
              <button
                onClick={() => { setSearch(''); setVerifiedOnly(false); }}
                className="text-sm text-secondary hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && !error && (
          <p className="text-sm text-on-surface-variant mb-6">
            {totalElements > 0
              ? `${totalElements.toLocaleString()} xưởng phù hợp`
              : 'Không tìm thấy xưởng nào'}
          </p>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">error_outline</span>
            <p className="text-on-surface-variant mb-4">{error}</p>
            <button
              onClick={fetchWorkshops}
              className="btn-user-primary-sm"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Workshop Grid / List ── */}
        {!error && (
          <>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <WorkshopSkeleton key={i} />)
                  : workshops.length === 0
                  ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                      <span className="material-symbols-outlined text-5xl text-outline mb-4">factory</span>
                      <p className="text-on-surface-variant">Không tìm thấy xưởng nào phù hợp.</p>
                    </div>
                  )
                  : workshops.map((ws) => (
                    <Link
                      key={ws.id}
                      to={`/workshop/${ws.id}`}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg hover:border-secondary/40 transition-all group block"
                    >
                      {/* Cover */}
                      <div className="h-48 overflow-hidden relative bg-gradient-to-br from-primary/10 to-secondary/10">
                        {ws.avatarUrl ? (
                          <img
                            src={ws.avatarUrl}
                            alt={ws.shopName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-6xl text-primary/20">factory</span>
                          </div>
                        )}
                        {ws.isVerified && (
                          <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 text-secondary text-xs font-bold px-2 py-1 rounded-full">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            Đã xác thực
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-semibold text-on-surface group-hover:text-secondary transition-colors truncate">
                          {ws.shopName}
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">{ws.fullName}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mt-2">
                          <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-bold text-on-surface text-sm">
                            {ws.ratingAvg ? Number(ws.ratingAvg).toFixed(1) : '—'}
                          </span>
                        </div>

                        {/* Address */}
                        {ws.workshopAddress && (
                          <div className="flex items-start gap-1.5 mt-2 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">location_on</span>
                            <span className="line-clamp-1">{ws.workshopAddress}</span>
                          </div>
                        )}

                        {/* Capacity */}
                        {ws.productionCapacity > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                            {ws.productionCapacity.toLocaleString()} sp/tháng
                          </div>
                        )}

                        {/* Description */}
                        {ws.description && (
                          <p className="text-xs text-on-surface-variant mt-3 line-clamp-2 leading-relaxed">
                            {ws.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              /* ── List view ── */
              <div className="space-y-4">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-28 bg-surface-container rounded-xl animate-pulse" />
                    ))
                  : workshops.length === 0
                  ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <span className="material-symbols-outlined text-5xl text-outline mb-4">factory</span>
                      <p className="text-on-surface-variant">Không tìm thấy xưởng nào phù hợp.</p>
                    </div>
                  )
                  : workshops.map((ws) => (
                    <Link
                      key={ws.id}
                      to={`/workshop/${ws.id}`}
                      className="flex gap-5 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-md hover:border-secondary/40 transition-all group p-4"
                    >
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        {ws.avatarUrl ? (
                          <img src={ws.avatarUrl} alt={ws.shopName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-3xl text-primary/30">factory</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-on-surface group-hover:text-secondary transition-colors truncate">
                              {ws.shopName}
                            </h3>
                            <p className="text-xs text-on-surface-variant">{ws.fullName}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {ws.isVerified && (
                              <span className="flex items-center gap-1 text-secondary text-xs font-bold">
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                Verified
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="font-bold text-on-surface">{ws.ratingAvg ? Number(ws.ratingAvg).toFixed(1) : '—'}</span>
                          </span>
                          {ws.workshopAddress && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              <span className="line-clamp-1 max-w-[200px]">{ws.workshopAddress}</span>
                            </span>
                          )}
                          {ws.productionCapacity > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                              {ws.productionCapacity.toLocaleString()} sp/tháng
                            </span>
                          )}
                        </div>

                        {ws.description && (
                          <p className="text-xs text-on-surface-variant mt-2 line-clamp-1">{ws.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            )}

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
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (i as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(i);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-on-surface-variant">…</span>
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
