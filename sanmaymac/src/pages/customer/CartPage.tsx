import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const getThumbnail = (item: any) =>
  item.product?.images?.find((i: any) => i.isThumbnail)?.imageUrl ??
  item.product?.images?.[0]?.imageUrl ?? '';

export const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { cart, loading, fetchCart, updateItem, removeItem, clearCart } = useCartStore();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try { await updateItem(itemId, newQty); }
    finally { setUpdatingId(null); }
  };

  const handleRemove = async (itemId: number) => {
    setRemovingId(itemId);
    try { await removeItem(itemId); }
    finally { setRemovingId(null); }
  };

  const items = cart?.items ?? [];
  const subtotal = cart?.subTotal ?? cart?.totalAmount ?? 0;

  // Group items theo workshopName — server chưa trả workshopName nên dùng productName prefix hoặc nhóm chung
  const byWorkshop = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.product?.workshopName ?? 'Xưởng may';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (!isAuthenticated) {
    return (
      <CustomerLayout>
        <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-20 text-center">
          <span className="material-symbols-outlined text-6xl text-outline mb-4 block">shopping_cart</span>
          <h2 className="font-bold text-xl text-on-surface mb-2">Vui lòng đăng nhập</h2>
          <p className="text-on-surface-variant mb-6">Đăng nhập để xem giỏ hàng của bạn.</p>
          <Link to="/auth/login" className="btn-user-primary-md">
            Đăng nhập
          </Link>
        </main>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8 text-sm">
          <Link to="/" className="text-on-surface-variant hover:text-secondary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-outline text-sm">chevron_right</span>
          <span className="text-secondary font-medium">Giỏ hàng</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-headline-lg text-on-surface">
            Giỏ hàng <span className="text-outline font-normal text-base">({items.length} sản phẩm)</span>
          </h1>
          {items.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-sm text-error hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Xóa tất cả
            </button>
          )}
        </div>

        {loading && items.length === 0 ? (
          /* Skeleton */
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty */
          <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl">
            <div className="w-24 h-24 mb-6 bg-surface-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-outline">shopping_cart</span>
            </div>
            <h2 className="font-bold text-xl text-on-surface mb-2">Giỏ hàng trống</h2>
            <p className="text-on-surface-variant mb-8">Hãy khám phá sản phẩm từ các xưởng may uy tín.</p>
            <Link to="/products" className="btn-user-primary-md">
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT: Items grouped by workshop */}
            <div className="lg:w-[65%] space-y-6">
              {Object.entries(byWorkshop).map(([workshopName, workshopItems]) => (
                <section key={workshopName} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
                  {/* Workshop header */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant bg-surface-container-low">
                    <span className="material-symbols-outlined text-secondary text-sm">store</span>
                    <span className="font-semibold text-sm text-on-surface">{workshopName}</span>
                  </div>

                  {workshopItems.map((item) => {
                    const price = item.unitPrice;
                    const thumb = getThumbnail(item);
                    const variantLabel = [item.color, item.size].filter(Boolean).join(', ');
                    const isUpdating = updatingId === item.id;
                    const isRemoving = removingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 border-b border-outline-variant last:border-b-0 transition-opacity ${isRemoving ? 'opacity-40' : ''}`}
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-surface-container rounded-xl overflow-hidden flex-shrink-0">
                          {thumb ? (
                            <img src={thumb} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-2xl text-outline">image</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.productId}`} className="font-medium text-on-surface text-sm hover:text-secondary transition-colors line-clamp-2">
                            {item.productName}
                          </Link>
                          {variantLabel && (
                            <p className="text-xs text-on-surface-variant mt-0.5">{variantLabel}</p>
                          )}
                          <p className="font-bold text-secondary text-sm mt-1">{fmt(price)}/cái</p>
                        </div>

                        {/* Qty controls */}
                        <div className={`flex items-center border-2 border-slate-200 rounded-xl overflow-hidden bg-white ${isUpdating ? 'opacity-60' : ''}`}>
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="btn-user-qty px-3 py-2"
                          >-</button>
                          <span className="px-4 py-2 font-bold text-slate-800 text-sm min-w-[2.5rem] text-center">
                            {isUpdating ? '…' : item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                            disabled={isUpdating}
                            className="btn-user-qty px-3 py-2"
                          >+</button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right w-28 flex-shrink-0">
                          <p className="font-bold text-secondary">{fmt(item.totalPrice)}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-on-surface-variant">{fmt(price)} × {item.quantity}</p>
                          )}
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving}
                          className="p-2 text-outline hover:text-error hover:bg-error/8 rounded-full transition-all disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>

            {/* RIGHT: Summary */}
            <div className="lg:w-[35%]">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm sticky top-24">
                <div className="p-6 border-b border-outline-variant">
                  <h2 className="font-bold text-on-surface text-lg">Tóm tắt đơn hàng</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-on-surface-variant">
                      <span>Tạm tính ({items.length} sản phẩm)</span>
                      <span>{fmt(subtotal)}</span>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant pt-4 flex justify-between items-end">
                    <span className="font-bold text-on-surface">Tổng cộng</span>
                    <span className="text-2xl font-extrabold text-orange-600">{fmt(subtotal)}</span>
                  </div>

                  <div className="bg-surface-container p-4 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-secondary text-sm">local_shipping</span>
                      Phí vận chuyển tính khi thanh toán
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
                      Thanh toán bảo mật 100%
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-3">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="btn-user-primary-lg"
                  >
                    <span className="material-symbols-outlined">lock</span>
                    Tiến hành đặt hàng
                  </button>
                  <Link to="/products" className="block text-center text-sm text-on-surface-variant hover:text-secondary transition-colors">
                    ← Tiếp tục mua sắm
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </CustomerLayout>
  );
};
