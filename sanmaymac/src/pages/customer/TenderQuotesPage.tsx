import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import {
  biddingService,
  type BiddingPostDetail,
  type BiddingQuote,
} from '../../services/endpoints/biddingService';
import { addressService, type UserAddress } from '../../services/endpoints/addressService';
import { EditTenderModal } from '../../components/customer/EditTenderModal';
import { WorkshopRatingBadge } from '../../components/customer/WorkshopRatingBadge';

const POST_STATUS: Record<string, string> = {
  OPEN: 'Đang nhận báo giá',
  CLOSED: 'Đã đóng',
  FULFILLED: 'Đã chọn xưởng',
};

const QUOTE_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ chọn', className: 'bg-amber-100 text-amber-800' },
  ACCEPTED: { label: 'Đã chọn', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Không được chọn', className: 'bg-slate-100 text-slate-600' },
};

const fmt = (n?: number) => (n ?? 0).toLocaleString('vi-VN') + '₫';

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TenderQuotesPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const id = Number(postId);

  const [post, setPost] = useState<BiddingPostDetail | null>(null);
  const [quotes, setQuotes] = useState<BiddingQuote[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [acceptQuoteId, setAcceptQuoteId] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sortedQuotes = useMemo(
    () =>
      [...quotes].sort((a, b) => {
        if (a.status === 'ACCEPTED') return -1;
        if (b.status === 'ACCEPTED') return 1;
        return (a.offeredPrice ?? 0) - (b.offeredPrice ?? 0);
      }),
    [quotes],
  );

  const canAccept = post?.status === 'OPEN';

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postRes, quotesRes, addressRes] = await Promise.all([
          biddingService.getPostById(id),
          biddingService.listPostQuotes(id, { page: 0, size: 100, sort: 'createdAt,desc' }),
          addressService.list(),
        ]);
        if (!mounted) return;
        setPost(postRes.data.data ?? null);
        setQuotes(quotesRes.data.data?.content ?? []);
        const addrList = addressRes.data.data ?? [];
        setAddresses(addrList);
        setSelectedAddressId(addrList.find((a) => a.isDefault)?.id ?? addrList[0]?.id ?? null);
      } catch {
        if (mounted) {
          setError('Không thể tải báo giá. Bạn có thể không có quyền xem yêu cầu này.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleAccept = async () => {
    if (!acceptQuoteId || !selectedAddressId || !post) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await biddingService.acceptQuote(post.id, acceptQuoteId, selectedAddressId);
      setSuccessMessage('Đã chọn báo giá và tạo đơn hàng gia công thành công.');
      setAcceptQuoteId(null);
      const orderId = res.data.data?.id;
      const [postRes, quotesRes] = await Promise.all([
        biddingService.getPostById(post.id),
        biddingService.listPostQuotes(post.id, { page: 0, size: 100, sort: 'createdAt,desc' }),
      ]);
      setPost(postRes.data.data ?? null);
      setQuotes(quotesRes.data.data?.content ?? []);
      if (orderId) {
        setTimeout(() => navigate(`/orders/${orderId}`), 1500);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể chấp nhận báo giá.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const reloadPost = async () => {
    const [postRes, quotesRes] = await Promise.all([
      biddingService.getPostById(id),
      biddingService.listPostQuotes(id, { page: 0, size: 100, sort: 'createdAt,desc' }),
    ]);
    setPost(postRes.data.data ?? null);
    setQuotes(quotesRes.data.data?.content ?? []);
  };

  const handleDeletePost = async () => {
    if (!post || post.status !== 'OPEN') return;
    if (!window.confirm('Xóa yêu cầu báo giá này? Hành động không thể hoàn tác.')) return;
    setDeleting(true);
    setError(null);
    try {
      await biddingService.deletePost(post.id);
      navigate('/my-tenders');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể xóa yêu cầu.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-6">
        <Link
          to="/my-tenders"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-secondary"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại danh sách
        </Link>

        {loading ? (
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-48 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        ) : post ? (
          <>
            <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
                  {POST_STATUS[post.status ?? 'OPEN'] ?? post.status}
                </span>
                <span className="text-xs text-on-surface-variant">#{post.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-on-surface">{post.title}</h1>
              {post.description ? (
                <p className="text-sm text-on-surface-variant whitespace-pre-line">{post.description}</p>
              ) : null}
              <p className="text-sm text-on-surface-variant">
                {post.quoteCount ?? quotes.length} báo giá · Đăng {formatDate(post.createdAt)}
              </p>
              {post.status === 'OPEN' ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="btn-user-outline-sm"
                  >
                    Sửa yêu cầu
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void handleDeletePost()}
                    className="px-3 py-2 text-sm font-semibold text-error border border-error/30 rounded-xl disabled:opacity-50"
                  >
                    Xóa yêu cầu
                  </button>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}
            {successMessage ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            ) : null}

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface">Báo giá từ xưởng</h2>

              {sortedQuotes.length ? (
                <div className="space-y-3">
                  {sortedQuotes.map((quote) => {
                    const status = QUOTE_STATUS[quote.status ?? 'PENDING'] ?? QUOTE_STATUS.PENDING;
                    const isPending = quote.status === 'PENDING';

                    return (
                      <article
                        key={quote.id}
                        className="rounded-2xl border border-outline-variant bg-surface p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
                            {(quote.workshopName ?? 'X')[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {quote.workshopId ? (
                                <Link
                                  to={`/workshop/${quote.workshopId}`}
                                  className="font-bold text-on-surface hover:text-secondary"
                                >
                                  {quote.workshopName ?? `Xưởng #${quote.workshopId}`}
                                </Link>
                              ) : (
                                <h3 className="font-bold text-on-surface">
                                  {quote.workshopName ?? 'Xưởng'}
                                </h3>
                              )}
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                                {status.label}
                              </span>
                            </div>
                            {quote.workshopId ? (
                              <WorkshopRatingBadge workshopId={quote.workshopId} />
                            ) : null}
                            <p className="text-2xl font-bold text-secondary">{fmt(quote.offeredPrice)}</p>
                            <p className="text-sm text-on-surface-variant">
                              Thời gian ước tính: {quote.estimateDays ?? '—'} ngày · Gửi lúc{' '}
                              {formatDate(quote.createdAt)}
                            </p>
                          </div>
                        </div>

                        {canAccept && isPending ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setAcceptQuoteId(quote.id)}
                            className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 shrink-0"
                          >
                            Chọn báo giá này
                          </button>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline">hourglass_empty</span>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    Chưa có xưởng nào gửi báo giá. Các xưởng sẽ xem yêu cầu trên sàn và phản hồi sớm.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {error ?? 'Không tìm thấy yêu cầu.'}
          </div>
        )}
      </div>

      {acceptQuoteId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => !saving && setAcceptQuoteId(null)}
            onKeyDown={(e) => e.key === 'Escape' && !saving && setAcceptQuoteId(null)}
            role="button"
            tabIndex={-1}
            aria-label="Đóng"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-on-surface">Xác nhận chọn báo giá</h3>
            <p className="text-sm text-on-surface-variant">
              Chọn địa chỉ giao hàng để tạo đơn gia công từ báo giá này.
            </p>

            {addresses.length ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                      selectedAddressId === addr.id
                        ? 'border-secondary bg-secondary/5'
                        : 'border-outline-variant'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-on-surface">{addr.receiverName}</p>
                      <p className="text-on-surface-variant">{addr.phone}</p>
                      <p className="text-on-surface-variant">
                        {addr.fullAddress ?? addr.detailedAddress}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Bạn cần thêm địa chỉ trước khi chấp nhận báo giá.{' '}
                <Link to="/addresses" className="font-semibold underline">
                  Thêm địa chỉ
                </Link>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setAcceptQuoteId(null)}
                className="flex-1 rounded-xl border border-outline-variant py-3 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving || !selectedAddressId}
                onClick={() => void handleAccept()}
                className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Đang xử lý…' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {post && editOpen ? (
        <EditTenderModal
          post={post}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => void reloadPost()}
        />
      ) : null}
    </CustomerLayout>
  );
};
