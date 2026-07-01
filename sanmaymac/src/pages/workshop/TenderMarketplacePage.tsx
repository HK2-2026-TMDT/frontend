import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type BiddingPostSummary } from '../../services/endpoints/workshopService';
import { POST_STATUS_LABELS } from '../../utils/biddingUi';
import { formatWorkshopDate } from '../../utils/workshopUi';

const PAGE_SIZE = 12;

export const WorkshopTenderMarketplacePage = () => {
  const [posts, setPosts] = useState<BiddingPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<'latest' | 'no-quotes'>('latest');
  const [maxQuotes, setMaxQuotes] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [aiTokenBalance, setAiTokenBalance] = useState<number | null>(null);

  useEffect(() => {
    workshopService
      .getWorkshopWallet()
      .then((res) => setAiTokenBalance(res.data.data?.aiTokenBalance ?? 0))
      .catch(() => setAiTokenBalance(null));
  }, []);

  const loadPosts = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);

    try {
      const response = await workshopService.getOpenBiddingPosts({
        keyword: keyword.trim() || undefined,
        sort,
        maxQuotes: maxQuotes.trim() ? Number(maxQuotes) : undefined,
        page: targetPage,
        size: PAGE_SIZE,
      });
      const data = response.data.data;
      setPosts(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setPage(data?.number ?? targetPage);
    } catch (loadError) {
      setPosts([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách bài đấu thầu.');
    } finally {
      setLoading(false);
    }
  }, [keyword, sort, maxQuotes, page]);

  useEffect(() => {
    void loadPosts(0);
  }, [sort]);

  const handleSearch = () => {
    setPage(0);
    void loadPosts(0);
  };

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <WorkshopPageHeader
          title="Yêu cầu gia công"
          description="Xem, tìm kiếm và lọc các bài đăng đặt may từ khách hàng."
          actions={
            <div className="flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary-fixed/20 px-4 py-2">
              <span className="material-symbols-outlined text-secondary">token</span>
              <div>
                <p className="text-[10px] font-semibold uppercase text-secondary">Token AI</p>
                <p className="text-sm font-bold text-on-surface">{aiTokenBalance ?? '…'}</p>
              </div>
            </div>
          }
        />

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 md:grid-cols-[1fr_160px_140px_auto]">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Tìm theo tiêu đề hoặc mô tả…"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'latest' | 'no-quotes')}
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="latest">Mới nhất</option>
            <option value="no-quotes">Ít báo giá</option>
          </select>
          <input
            type="number"
            min={0}
            value={maxQuotes}
            onChange={(e) => setMaxQuotes(e.target.value)}
            placeholder="≤ báo giá"
            title="Lọc bài có số báo giá tối đa"
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl bg-secondary px-6 py-2.5 text-sm font-semibold text-white"
          >
            Tìm kiếm
          </button>
        </div>

        {!loading && totalElements > 0 ? (
          <p className="text-sm text-on-surface-variant">{totalElements} bài đăng phù hợp</p>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        ) : posts.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-surface-container-high px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                      #{post.id}
                    </span>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                      {POST_STATUS_LABELS[post.status ?? 'OPEN'] ?? post.status}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {post.quoteCount ?? 0} báo giá
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-on-surface">{post.title}</h3>
                  {post.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{post.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-on-surface-variant">{formatWorkshopDate(post.createdAt)}</p>

                  <div className="mt-auto flex gap-2 pt-4">
                    <Link
                      to={`/workshop/marketplace/${post.id}`}
                      className="flex-1 rounded-xl bg-secondary py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={page <= 0 || loading}
                  onClick={() => void loadPosts(page - 1)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-sm text-on-surface-variant">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => void loadPosts(page + 1)}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-6 py-16 text-center text-sm text-on-surface-variant">
            Không tìm thấy bài đăng phù hợp.
          </div>
        )}
      </div>
    </WorkshopLayout>
  );
};
