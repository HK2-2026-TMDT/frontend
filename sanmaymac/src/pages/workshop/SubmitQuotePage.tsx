import { useEffect, useState } from 'react';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type BiddingPostSummary } from '../../services/endpoints/workshopService';

export const SubmitQuotePage = () => {
  const [posts, setPosts] = useState<BiddingPostSummary[]>([]);
  const [selectedPost, setSelectedPost] = useState<BiddingPostSummary | null>(null);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [estimateDays, setEstimateDays] = useState('7');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await workshopService.getOpenBiddingPosts({ page: 0, size: 10, sort: 'latest' });
        if (mounted) setPosts(response.data.data?.content ?? []);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách bài OPEN.');
          setPosts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  const submitQuote = async () => {
    if (!selectedPost) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await workshopService.submitWorkshopQuote(selectedPost.id, {
        offeredPrice: Number(offeredPrice),
        estimateDays: Number(estimateDays),
      });
      setSuccessMessage(`Đã gửi báo giá cho bài #${selectedPost.id}.`);
      setSelectedPost(null);
      setOfferedPrice('');
      setEstimateDays('7');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi báo giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-on-surface">Gửi báo giá</h1>
          <p className="text-sm text-on-surface-variant mt-1">Chọn một bài đăng OPEN và gửi báo giá trực tiếp từ API.</p>
        </header>

        {error && <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}
        {successMessage && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">Đang tải bài OPEN...</div>
            ) : posts.length ? (
              posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left bg-surface-container-lowest border rounded-2xl p-5 shadow-sm transition-all ${selectedPost?.id === post.id ? 'border-secondary ring-2 ring-secondary/20' : 'border-outline-variant hover:border-secondary/40'}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-bold text-on-surface">{post.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-green-100 text-green-700">MỞ</span>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2">{post.description ?? 'Không có mô tả.'}</p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">Không có bài đăng nào.</div>
            )}
          </div>

          <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm sticky top-6 space-y-4">
            <h2 className="font-bold text-lg text-on-surface">Chi tiết báo giá</h2>
            {selectedPost ? (
              <>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary">{selectedPost.id}</p>
                  <p className="font-semibold text-on-surface">{selectedPost.title}</p>
                  <p className="text-sm text-on-surface-variant">{selectedPost.companyName ?? selectedPost.customerName ?? 'Khách hàng'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Đơn giá đề xuất</label>
                  <input value={offeredPrice} onChange={(event) => setOfferedPrice(event.target.value)} type="number" className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số ngày ước tính</label>
                  <input value={estimateDays} onChange={(event) => setEstimateDays(event.target.value)} type="number" className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" placeholder="7" />
                </div>
                <button onClick={() => void submitQuote()} disabled={saving || !offeredPrice || !estimateDays} className="w-full py-3 bg-secondary text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {saving ? 'Đang gửi...' : 'Gửi báo giá'}
                </button>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">Chọn một bài đăng bên trái để mở form gửi báo giá.</p>
            )}
          </div>
        </div>
      </div>
    </WorkshopLayout>
  );
};
