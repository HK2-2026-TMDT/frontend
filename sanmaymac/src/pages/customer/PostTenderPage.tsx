import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { biddingService, type SavedDesignResponse } from '../../services/endpoints/biddingService';
import { DesignStudioCanvas, type DesignStudioHandle } from '../../features/design-studio/components/DesignStudioCanvas';

const quantities = ['< 100 cái', '100 – 500 cái', '500 – 1,000 cái', '1,000 – 5,000 cái', '> 5,000 cái'];
const budgets = ['< 10 triệu', '10 – 50 triệu', '50 – 200 triệu', '> 200 triệu'];
const deliveries = ['Càng sớm càng tốt', '1 – 2 tuần', '2 – 4 tuần', '1 – 3 tháng'];

const PRODUCT_OPTIONS = [
  { id: 'ao-thun', name: 'Áo thun', category: 'May mặc', icon: 'styler', hint: 'Phù hợp đồng phục và chiến dịch sự kiện' },
  { id: 'ao-polo', name: 'Áo polo', category: 'May mặc', icon: 'checkroom', hint: 'Form lịch sự, phù hợp team sale và văn phòng' },
  { id: 'hoodie', name: 'Hoodie', category: 'May mặc', icon: 'snowing', hint: 'Phù hợp nhóm trẻ, CLB và merch branding' },
  { id: 'ao-khoac', name: 'Áo khoác', category: 'May mặc', icon: 'downhill_skiing', hint: 'Dành cho đồng phục ngoài trời, bảo hộ nhẹ' },
  { id: 'tap-de', name: 'Tạp dề', category: 'Phụ kiện', icon: 'iron', hint: 'Nhà hàng, cafe, bếp công nghiệp' },
  { id: 'mu-luoi-trai', name: 'Mũ lưỡi trai', category: 'Phụ kiện', icon: 'face_3', hint: 'Quà tặng nhận diện thương hiệu dễ triển khai' },
];

const baseForm = {
  title: '',
  category: '',
  description: '',
  quantity: '',
  budget: '',
  delivery: '',
  requirements: '',
  location: '',
};

type SavedDesign = {
  id: number;
  name: string;
  frontDesignUrl: string;
  backDesignUrl: string;
  createdAt: string;
};

const hideBrokenImage = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.style.display = 'none';
};

const composeDescription = (
  form: typeof baseForm,
  productOption: (typeof PRODUCT_OPTIONS)[number] | null
) => {
  return [
    form.description.trim(),
    productOption ? `Sản phẩm chọn: ${productOption.name}` : '',
    form.category ? `Danh mục: ${form.category}` : '',
    form.quantity ? `Số lượng: ${form.quantity}` : '',
    form.budget ? `Ngân sách: ${form.budget}` : '',
    form.delivery ? `Thời gian giao: ${form.delivery}` : '',
    form.location ? `Khu vực giao: ${form.location}` : '',
    form.requirements ? `Yêu cầu thêm: ${form.requirements}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

export const PostTenderPage = () => {
  const navigate = useNavigate();
  const designRef = useRef<DesignStudioHandle>(null);
  const { isAuthenticated, user } = useAuthStore();

  const [form, setForm] = useState(baseForm);
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ postId: number; message: string } | null>(null);
  const [brokenImageKeys, setBrokenImageKeys] = useState<Record<string, boolean>>({});

  const selectedDesign = useMemo(() => {
    if (!designs.length) return null;
    return designs.find((design) => design.id === selectedDesignId) ?? designs[0];
  }, [designs, selectedDesignId]);

  const selectedProduct = useMemo(
    () => PRODUCT_OPTIONS.find((product) => product.id === selectedProductId) ?? null,
    [selectedProductId]
  );

  const canSubmit = useMemo(
    () => !!selectedDesign && !!selectedProduct && !!form.title.trim() && !!form.description.trim(),
    [selectedDesign, selectedProduct, form.title, form.description]
  );

  const steps = useMemo(
    () => [
      { id: 1, label: 'Thiết kế', done: !!selectedDesign },
      { id: 2, label: 'Chọn sản phẩm', done: !!selectedProduct },
      { id: 3, label: 'Gửi nhận báo giá', done: canSubmit },
    ],
    [selectedDesign, selectedProduct, canSubmit]
  );

  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated || user?.role !== 'customer') return;

    const loadDesigns = async () => {
      setIsLoadingDesigns(true);
      try {
        const response = await biddingService.listMyDesigns();
        const items = response.data.data ?? [];
        if (!mounted) return;
        setDesigns(
          items.map((item: SavedDesignResponse) => ({
            id: item.id,
            name: item.name,
            frontDesignUrl: item.frontDesignUrl,
            backDesignUrl: item.backDesignUrl,
            createdAt: item.createdAt,
          }))
        );
        setSelectedDesignId(items[0]?.id ?? null);
      } catch {
        if (mounted) {
          setSubmitError('Không thể tải danh sách thiết kế đã lưu.');
        }
      } finally {
        if (mounted) {
          setIsLoadingDesigns(false);
        }
      }
    };

    void     loadDesigns();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.role]);

  const setField = (key: keyof typeof baseForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePickProduct = (productId: string) => {
    const nextProduct = PRODUCT_OPTIONS.find((item) => item.id === productId);
    if (!nextProduct) return;

    setSelectedProductId(productId);
    setField('category', nextProduct.category);
    setForm((prev) => ({
      ...prev,
      category: nextProduct.category,
      title:
        prev.title.trim() && !prev.title.startsWith('Cần báo giá')
          ? prev.title
          : `Cần báo giá sản xuất ${nextProduct.name}`,
    }));
  };

  const handleSaveDesign = async () => {
    if (!designRef.current?.hasDesign()) {
      setSubmitError('Hãy thêm ít nhất một sticker trước khi lưu thiết kế.');
      return;
    }

    setIsSavingDesign(true);
    setSubmitError(null);

    try {
      const { frontDesign, backDesign } = await designRef.current.exportDesigns();
      const saveRes = await biddingService.saveDesign(frontDesign, backDesign);
      const saved = saveRes.data.data;
      const nextDesign: SavedDesign = {
        id: saved.id,
        name: saved.name,
        frontDesignUrl: saved.frontDesignUrl,
        backDesignUrl: saved.backDesignUrl,
        createdAt: saved.createdAt,
      };

      setDesigns((prev) => [nextDesign, ...prev]);
      setSelectedDesignId(nextDesign.id);
      designRef.current.clearActiveCanvas();
      setIsStudioOpen(false);
    } catch {
      setSubmitError('Không thể lưu thiết kế lúc này. Vui lòng thử lại.');
    } finally {
      setIsSavingDesign(false);
    }
  };

  const markBroken = (key: string) => (event: SyntheticEvent<HTMLImageElement>) => {
    hideBrokenImage(event);
    setBrokenImageKeys((prev) => ({ ...prev, [key]: true }));
  };

  const clearBroken = (key: string) => () => {
    setBrokenImageKeys((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    if (!selectedDesign) {
      setSubmitError('Bạn cần chọn một thiết kế để đăng nhận báo giá.');
      return;
    }

    if (!selectedProduct) {
      setSubmitError('Hãy chọn loại sản phẩm bạn muốn sản xuất.');
      return;
    }

    if (!canSubmit) {
      setSubmitError('Vui lòng nhập tiêu đề và mô tả ngắn để xưởng nắm yêu cầu.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const createRes = await biddingService.createPost({
        title: form.title.trim(),
        description: composeDescription(form, selectedProduct),
        aiImageUrl: '',
        frontDesignUrl: selectedDesign.frontDesignUrl,
        backDesignUrl: selectedDesign.backDesignUrl,
        attachments: [],
      });

      setSubmitSuccess({
        postId: createRes.data.data.id,
        message: 'Đăng nhận báo giá thành công. Xưởng sẽ bắt đầu gửi báo giá cho thiết kế của bạn.',
      });
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || 'Không thể tạo bài đấu thầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerLayout>
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="mb-8 space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-secondary text-sm">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Quay lại
          </Link>

          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Đấu thầu sản xuất</p>
              <h1 className="font-headline-lg text-on-surface">Thiết kế xong, chọn sản phẩm, nhận báo giá nhanh</h1>
              <p className="text-on-surface-variant font-body-md mt-1">
                Luồng mới tập trung vào trải nghiệm: chọn mẫu thiết kế trước, rồi chọn đúng loại sản phẩm muốn sản xuất.
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">Tài khoản:</span> {user?.name || 'Khách hàng'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  step.done
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-surface text-on-surface-variant border-outline-variant'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{step.done ? 'check_circle' : 'radio_button_unchecked'}</span>
                Bước {step.id}: {step.label}
              </div>
            ))}
          </div>
        </div>

        {submitError && (
          <div className="mb-6 rounded-2xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/5 px-4 py-4 text-sm text-green-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-semibold">{submitSuccess.message}</p>
              <p className="text-green-700/80 mt-1">Mã bài đăng: #{submitSuccess.postId}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/my-tenders/${submitSuccess.postId}`}
                className="px-4 py-2 rounded-xl bg-secondary text-white font-medium hover:opacity-90 transition-all"
              >
                Xem báo giá
              </Link>
              <button
                type="button"
                onClick={() => setSubmitSuccess(null)}
                className="px-4 py-2 rounded-xl border border-green-500/30 bg-white text-green-700 font-medium hover:bg-green-50 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="space-y-6">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 md:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Bước 1</p>
                  <h2 className="font-headline-md text-on-surface">Chọn thiết kế đã lưu</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Mặc định xem mặt trước, hover để xem mặt sau. Chọn một thiết kế để dùng khi đăng nhận báo giá.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudioOpen(true)}
                  className="inline-flex items-center justify-center gap-2 btn-user-primary-sm"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Tạo thiết kế mới
                </button>
              </div>

              {isLoadingDesigns ? (
                <div className="rounded-3xl border border-outline-variant bg-surface px-6 py-14 text-center text-sm text-on-surface-variant">
                  Đang tải danh sách thiết kế...
                </div>
              ) : designs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-outline-variant bg-surface px-6 py-16 text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-3xl">styler</span>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface">Bạn chưa có thiết kế nào</h3>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-xl mx-auto">
                    Nhấn “Tạo thiết kế mới”, hoàn thiện mockup và lưu lại. Thiết kế đó sẽ xuất hiện ngay tại dashboard này.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsStudioOpen(true)}
                    className="mt-6 btn-user-outline-md"
                  >
                    <span className="material-symbols-outlined text-base">brush</span>
                    Bắt đầu thiết kế
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {designs.map((design) => (
                    (() => {
                      const frontUrl = biddingService.resolveDesignAssetUrl(design.frontDesignUrl);
                      const backUrl = biddingService.resolveDesignAssetUrl(design.backDesignUrl);
                      const frontKey = `card-front-${design.id}`;
                      const backKey = `card-back-${design.id}`;
                      const bothBroken = !!brokenImageKeys[frontKey] && !!brokenImageKeys[backKey];
                      return (
                    <button
                      key={design.id}
                      type="button"
                      onClick={() => setSelectedDesignId(design.id)}
                      className={`group text-left rounded-2xl border bg-surface overflow-hidden transition-all ${
                        selectedDesignId === design.id
                          ? 'border-secondary ring-2 ring-secondary/20'
                          : 'border-outline-variant hover:border-secondary/60'
                      }`}
                    >
                      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                        <img
                          src={frontUrl}
                          alt="Thiết kế mặt trước"
                          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500 group-hover:opacity-0"
                          onError={markBroken(frontKey)}
                          onLoad={clearBroken(frontKey)}
                        />
                        <img
                          src={backUrl}
                          alt="Thiết kế mặt sau"
                          className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          onError={markBroken(backKey)}
                          onLoad={clearBroken(backKey)}
                        />
                        {bothBroken && (
                          <div className="absolute inset-0 flex items-center justify-center text-center px-4 pointer-events-none">
                            <div className="rounded-xl bg-black/45 text-white text-xs px-3 py-2">
                              Ảnh thiết kế cũ không còn khả dụng
                            </div>
                          </div>
                        )}
                        <div className="absolute left-3 top-3 rounded-full bg-black/60 text-white text-[11px] px-2 py-1">
                          Hover xem mặt sau
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="font-semibold text-sm text-on-surface">{design.name || `Thiết kế #${design.id}`}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Lưu lúc {new Date(design.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                      );
                    })()
                  ))}
                </div>
              )}
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 md:p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Bước 2</p>
                <h2 className="font-headline-md text-on-surface">Chọn sản phẩm cần sản xuất</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Sau khi có thiết kế, chọn đúng loại sản phẩm để xưởng báo giá chính xác hơn.
                </p>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 ${!selectedDesign ? 'opacity-60' : ''}`}>
                {PRODUCT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handlePickProduct(option.id)}
                    disabled={!selectedDesign}
                    className={`rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed ${
                      selectedProductId === option.id
                        ? 'border-secondary ring-2 ring-secondary/20 bg-secondary-fixed/20'
                        : 'border-outline-variant hover:border-secondary/60 bg-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-secondary">{option.icon}</span>
                    <p className="mt-2 font-semibold text-on-surface">{option.name}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{option.hint}</p>
                  </button>
                ))}
              </div>
              {!selectedDesign && (
                <p className="text-xs text-on-surface-variant">Bạn cần chọn thiết kế trước để mở bước chọn sản phẩm.</p>
              )}
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 md:p-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Bước 3</p>
                <h2 className="font-headline-md text-on-surface">Brief nhanh để nhận báo giá</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Chỉ nhập các thông tin cần thiết, hệ thống sẽ đính kèm thiết kế đã chọn vào bài đăng.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-label-sm text-on-surface-variant">Tiêu đề bài đăng</label>
                  <input
                    value={form.title}
                    onChange={(event) => setField('title', event.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
                    placeholder="Ví dụ: Cần báo giá sản xuất 500 áo thun sự kiện"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-label-sm text-on-surface-variant">Mô tả ngắn yêu cầu</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setField('description', event.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none resize-none h-28 bg-surface"
                    placeholder="Mô tả chất liệu, kỹ thuật in/thêu, form dáng, tiêu chuẩn mong muốn..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-label-sm text-on-surface-variant">Số lượng dự kiến</label>
                  <select
                    value={form.quantity}
                    onChange={(event) => setField('quantity', event.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm outline-none bg-surface"
                  >
                    <option value="">Chọn số lượng</option>
                    {quantities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label-sm text-on-surface-variant">Ngân sách</label>
                  <select
                    value={form.budget}
                    onChange={(event) => setField('budget', event.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm outline-none bg-surface"
                  >
                    <option value="">Chọn ngân sách</option>
                    {budgets.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label-sm text-on-surface-variant">Thời gian cần hàng</label>
                  <select
                    value={form.delivery}
                    onChange={(event) => setField('delivery', event.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm outline-none bg-surface"
                  >
                    <option value="">Chọn thời gian</option>
                    {deliveries.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label-sm text-on-surface-variant">Khu vực giao hàng</label>
                  <input
                    value={form.location}
                    onChange={(event) => setField('location', event.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
                    placeholder="Ví dụ: TP. Hồ Chí Minh"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-label-sm text-on-surface-variant">Yêu cầu đặc biệt</label>
                  <textarea
                    value={form.requirements}
                    onChange={(event) => setField('requirements', event.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none resize-none h-24 bg-surface"
                    placeholder="Ví dụ: cần mẫu thử trước, đóng gói theo combo, in QR code..."
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-2">Tóm tắt</p>
                <h2 className="font-headline-md text-on-surface">Sẵn sàng đăng nhận báo giá</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant">Thiết kế</span>
                  <span className="font-medium text-on-surface">{selectedDesign ? 'Đã chọn' : 'Chưa chọn'}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant">Sản phẩm</span>
                  <span className="font-medium text-on-surface">{selectedProduct?.name || 'Chưa chọn'}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant">Tiêu đề</span>
                  <span className="font-medium text-on-surface text-right max-w-[180px] truncate">{form.title || 'Chưa nhập'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Mô tả</span>
                  <span className="font-medium text-on-surface">{form.description.trim() ? 'Đã nhập' : 'Chưa nhập'}</span>
                </div>
              </div>

              {selectedDesign && (
                (() => {
                  const selectedFrontKey = `summary-front-${selectedDesign.id}`;
                  const selectedFrontUrl = biddingService.resolveDesignAssetUrl(selectedDesign.frontDesignUrl);
                  const isBroken = !!brokenImageKeys[selectedFrontKey];
                  return (
                <div className="relative w-full h-44 rounded-2xl border border-outline-variant bg-surface overflow-hidden">
                  <img
                    src={selectedFrontUrl}
                    alt="Thiết kế đã chọn"
                    className="w-full h-full object-contain"
                    onError={markBroken(selectedFrontKey)}
                    onLoad={clearBroken(selectedFrontKey)}
                  />
                  {isBroken && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="rounded-xl bg-slate-900/60 text-white text-xs px-3 py-2">
                        Không tải được ảnh preview
                      </span>
                    </div>
                  )}
                </div>
                  );
                })()
              )}
            </div>

            {!isAuthenticated && (
              <div className="bg-warning/10 border border-warning/20 rounded-3xl p-5 text-sm text-on-surface-variant space-y-3">
                <p className="font-semibold text-on-surface">Bạn cần đăng nhập để đăng nhận báo giá.</p>
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="btn-user-primary-sm"
                >
                  Đăng nhập
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
              className="btn-user-primary-lg rounded-2xl"
            >
              <span className="material-symbols-outlined text-sm">{isSubmitting ? 'hourglass_empty' : 'send'}</span>
              {isSubmitting ? 'Đang đăng nhận báo giá...' : 'Đăng nhận báo giá'}
            </button>

            <p className="text-xs text-on-surface-variant text-center leading-relaxed">
              Bài đăng sẽ dùng trực tiếp thiết kế đã lưu và loại sản phẩm bạn đã chọn để các xưởng gửi báo giá nhanh hơn.
            </p>
          </aside>
        </div>
      </main>

      {isStudioOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsStudioOpen(false)} />

          <div className="relative z-10 flex h-[min(900px,94vh)] w-[min(1280px,98vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">Design Studio</p>
                <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">Tạo thiết kế mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStudioOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800"
                aria-label="Đóng modal thiết kế"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-hidden">
              <DesignStudioCanvas ref={designRef} />
            </div>

            <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setIsStudioOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveDesign}
                disabled={isSavingDesign}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base">{isSavingDesign ? 'hourglass_empty' : 'save'}</span>
                {isSavingDesign ? 'Đang lưu...' : 'Lưu thiết kế'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
};
