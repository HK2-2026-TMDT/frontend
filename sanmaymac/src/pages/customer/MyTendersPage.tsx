import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { EditTenderModal } from '../../components/customer/EditTenderModal';
import {
  biddingService,
  type BiddingPostDetail,
  type BiddingPostSummary,
} from '../../services/endpoints/biddingService';

const POST_STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Đang nhận báo giá', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-700' },
  FULFILLED: { label: 'Đã chọn xưởng', className: 'bg-blue-100 text-blue-800' },
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const MyTendersPage = () => {
  const [posts, setPosts] = useState<BiddingPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<BiddingPostDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await biddingService.listMyPosts({ page: 0, size: 50, sort: 'createdAt,desc' });
      setPosts(res.data.data?.content ?? []);
    } catch {
      setError('Không thể tải danh sách yêu cầu của bạn.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const handleEdit = async (postId: number) => {
    try {
      const res = await biddingService.getPostById(postId);
      setEditPost(res.data.data ?? null);
      setEditOpen(true);
    } catch {
      setError('Không thể tải chi tiết yêu cầu.');
    }
  };

  const handleDelete = async (postId: number) => {
    if (!window.confirm('Xóa yêu cầu báo giá này?')) return;
    setDeletingId(postId);
    setError(null);
    try {
      await biddingService.deletePost(postId);
      await loadPosts();
    } catch {
      setError('Không thể xóa yêu cầu.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Đấu thầu</p>
            <h1 className="font-headline-lg text-on-surface">Yêu cầu báo giá của tôi</h1>
            <p className="text-on-surface-variant mt-1">
              Xem các xưởng đã gửi báo giá cho thiết kế và yêu cầu sản xuất của bạn.
            </p>
          </div>
          <Link
            to="/create-tender"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Đăng yêu cầu mới
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        ) : posts.length ? (
          <div className="space-y-3">
            {posts.map((post) => {
              const status = POST_STATUS[post.status ?? 'OPEN'] ?? POST_STATUS.OPEN;
              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-on-surface-variant">#{post.id}</span>
                      </div>
                      <h2 className="text-lg font-bold text-on-surface truncate">{post.title}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">request_quote</span>
                          {post.quoteCount ?? 0} báo giá
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">calendar_today</span>
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link
                        to={`/my-tenders/${post.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/10"
                      >
                        Xem báo giá
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </Link>
                      {post.status === 'OPEN' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleEdit(post.id)}
                            className="btn-user-outline-sm"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === post.id}
                            onClick={() => void handleDelete(post.id)}
                            className="px-3 py-2.5 text-sm font-semibold text-error border border-error/30 rounded-xl disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-6 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline">inventory</span>
            <h3 className="mt-4 text-lg font-bold text-on-surface">Chưa có yêu cầu nào</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Đăng thiết kế và chọn sản phẩm để nhận báo giá từ các xưởng.
            </p>
            <Link
              to="/create-tender"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Tạo yêu cầu đầu tiên
            </Link>
          </div>
        )}
      </div>

      {editPost && editOpen ? (
        <EditTenderModal
          post={editPost}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => void loadPosts()}
        />
      ) : null}
    </CustomerLayout>
  );
};
