import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cartService } from '../../services/endpoints/cartService';
import { addressService, UserAddress } from '../../services/endpoints/addressService';
import { shippingService, ShippingQuote } from '../../services/endpoints/shippingService';
import { AddressFormModal } from '../../components/address/AddressFormModal';

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { cart, fetchCart, reset: resetCart } = useCartStore();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [coupon, setCoupon] = useState('');
  const [note, setNote] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const res = await addressService.list();
      const list = res.data.data ?? [];
      setAddresses(list);
      setSelectedAddressId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        const def = list.find((a) => a.isDefault) ?? list[0];
        return def?.id ?? null;
      });
    } catch {
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAddresses();
  }, [isAuthenticated, loadAddresses]);

  const items = cart?.items ?? [];
  const subtotal = cart?.subTotal ?? cart?.totalAmount ?? 0;
  const shippingFee = shippingQuote?.available ? toNumber(shippingQuote.fee) : 0;
  const grandTotal = subtotal + shippingFee;

  useEffect(() => {
    if (!selectedAddressId || items.length === 0) {
      setShippingQuote(null);
      return;
    }
    setLoadingShipping(true);
    shippingService
      .quote(selectedAddressId)
      .then((res) => setShippingQuote(res.data.data ?? null))
      .catch(() =>
        setShippingQuote({
          fee: 0,
          available: false,
          message: 'Không thể tính phí vận chuyển.',
        }),
      )
      .finally(() => setLoadingShipping(false));
  }, [selectedAddressId, items.length]);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Vui lòng chọn địa chỉ giao hàng.');
      return;
    }
    if (items.length === 0) {
      setError('Giỏ hàng trống.');
      return;
    }
    setError(null);
    setPlacing(true);
    try {
      const res = await cartService.checkout(selectedAddressId, coupon || undefined, note || undefined);
      const batchId = res.data.data?.checkoutBatchId;
      resetCart();
      if (batchId) {
        navigate(`/payment/batch/${batchId}`);
      } else {
        navigate('/orders');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        setError(msg ?? 'Giỏ hàng có vấn đề. Vui lòng kiểm tra lại.');
      } else {
        setError(msg ?? 'Đặt hàng thất bại. Vui lòng thử lại.');
      }
    } finally {
      setPlacing(false);
    }
  };

  const handleAddressSaved = async (address: UserAddress) => {
    await loadAddresses();
    setSelectedAddressId(address.id);
  };

  if (!isAuthenticated) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-on-surface-variant mb-4">Vui lòng đăng nhập để tiếp tục.</p>
          <Link to="/auth/login" className="btn-user-primary-md">Đăng nhập</Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center gap-3 mb-8 text-sm">
          <Link to="/" className="text-on-surface-variant hover:text-secondary">Trang chủ</Link>
          <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
          <Link to="/cart" className="text-on-surface-variant hover:text-secondary">Giỏ hàng</Link>
          <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
          <span className="text-secondary font-medium">Thanh toán</span>
        </div>

        <h1 className="font-headline-lg text-on-surface mb-8">Thanh toán & Đặt hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">location_on</span>
                  <h2 className="font-semibold text-on-surface">Địa chỉ giao hàng</h2>
                </div>
                <Link to="/addresses" className="text-xs text-secondary font-medium hover:underline">
                  Quản lý địa chỉ
                </Link>
              </div>

              {loadingAddresses ? (
                <div className="h-20 bg-surface-container rounded-xl animate-pulse" />
              ) : addresses.length === 0 ? (
                <div className="p-4 border border-dashed border-outline-variant rounded-xl text-center">
                  <p className="text-sm text-on-surface-variant mb-3">Bạn chưa có địa chỉ giao hàng.</p>
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="text-sm text-secondary font-bold hover:underline flex items-center gap-1 mx-auto"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200/60'
                          : 'border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-secondary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-on-surface">{addr.receiverName}</p>
                          <span className="text-sm text-on-surface-variant">·</span>
                          <p className="text-sm text-on-surface-variant">{addr.phone}</p>
                          {addr.isDefault && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface-variant mt-0.5">
                          {addr.fullAddress || addr.detailedAddress}
                        </p>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="text-sm text-secondary font-medium hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Thêm địa chỉ mới
                  </button>
                </div>
              )}
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary">local_offer</span>
                <h2 className="font-semibold text-on-surface">Mã giảm giá</h2>
              </div>
              <div className="flex gap-3">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Nhập mã giảm giá..."
                  className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
                />
                <button type="button" className="btn-user-outline-md">
                  Áp dụng
                </button>
              </div>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-secondary">note_alt</span>
                <h2 className="font-semibold text-on-surface">Ghi chú đơn hàng</h2>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-outline-variant rounded-xl p-4 text-sm focus:ring-2 focus:ring-secondary outline-none resize-none h-24 bg-surface"
                placeholder="Ghi chú cho xưởng (không bắt buộc)..."
              />
            </section>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-outline-variant">
                <h2 className="font-bold text-on-surface text-lg">Tóm tắt đơn hàng</h2>
              </div>

              <div className="p-6 space-y-4 max-h-72 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-4">Giỏ hàng trống</p>
                ) : (
                  items.map((item) => {
                    const unitPrice = toNumber(item.unitPrice ?? item.variant?.price);
                    const lineTotal = toNumber(item.totalPrice) || unitPrice * item.quantity;
                    const variantLabel = [item.color ?? item.variant?.color, item.size ?? item.variant?.size]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-14 h-14 bg-surface-container rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl text-outline">image</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-on-surface text-sm line-clamp-2">
                            {item.productName || item.product?.name}
                          </p>
                          {variantLabel && (
                            <p className="text-xs text-on-surface-variant">{variantLabel}</p>
                          )}
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-on-surface-variant">x{item.quantity}</span>
                            <span className="font-bold text-sm text-on-surface">{fmt(lineTotal)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-6 bg-surface-container-low border-t border-outline-variant space-y-3">
                <div className="flex justify-between text-sm text-on-surface-variant">
                  <span>Tạm tính</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-on-surface-variant">
                  <span>Phí vận chuyển</span>
                  {loadingShipping ? (
                    <span className="text-xs italic">Đang tính...</span>
                  ) : shippingQuote?.available ? (
                    <span>{fmt(shippingFee)}</span>
                  ) : (
                    <span className="text-xs italic text-right max-w-[160px]">
                      {shippingQuote?.message ?? 'Tính khi xác nhận'}
                    </span>
                  )}
                </div>
                <div className="pt-3 border-t border-outline-variant flex justify-between items-end">
                  <span className="font-bold text-on-surface">Tổng cộng</span>
                  <span className="text-2xl font-extrabold text-orange-600">{fmt(grandTotal)}</span>
                </div>
              </div>

              {error && (
                <div className="mx-6 mb-2 p-3 bg-error/8 border border-error/20 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-sm">error</span>
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <div className="p-6 pt-2">
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || items.length === 0 || !selectedAddressId}
                  className="btn-user-primary-lg"
                >
                  <span className="material-symbols-outlined">
                    {placing ? 'hourglass_empty' : 'lock'}
                  </span>
                  {placing ? 'Đang đặt hàng...' : 'Đặt hàng ngay'}
                </button>
                <p className="text-center text-xs text-on-surface-variant mt-3 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Giao dịch an toàn & Bảo mật thông tin
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AddressFormModal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSaved={handleAddressSaved}
      />
    </CustomerLayout>
  );
};
