import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { catalogService, Product } from '../../services/endpoints/catalogService';
import { cacheKeys, cacheService, cacheTtl } from '../../services/cache';
import { useAuthStore } from '../../store/useAuthStore';

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const getThumbnail = (product: Product) =>
  product.images?.find((i) => i.isThumbnail)?.imageUrl ??
  product.images?.[0]?.imageUrl ?? '';

export const WishlistPage = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const userId = useAuthStore.getState().user?.id;
    const cacheKey = userId ? cacheKeys.favoriteProducts(userId) : null;
    const cachedFavorites = cacheKey ? cacheService.get<Product[]>(cacheKey) : null;

    if (cachedFavorites) {
      setItems(cachedFavorites);
      setLoading(false);
      return;
    }

    catalogService.getFavoriteProducts()
      .then((res) => {
        const favorites = res.data.data ?? [];
        setItems(favorites);
        if (cacheKey) {
          cacheService.set(cacheKey, favorites, cacheTtl.favoriteProducts);
        }
      })
      .catch(() => setError('Không thể tải danh sách yêu thích. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: number) => {
    setRemovingId(id);
    try {
      await catalogService.removeFavoriteProduct(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        cacheService.remove(cacheKeys.favoriteProducts(userId));
      }
    } catch {
      setError('Không thể bỏ sản phẩm khỏi danh sách yêu thích.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <CustomerLayout>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline-lg text-on-surface">Danh sách yêu thích</h1>
            <p className="text-on-surface-variant font-body-md mt-1">{items.length} sản phẩm đã lưu</p>
          </div>
          <Link to="/products" className="flex items-center gap-2 text-secondary hover:underline font-label-sm">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Tiếp tục khám phá
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden animate-pulse">
                <div className="h-52 bg-surface-container" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                  <div className="h-3 bg-surface-container rounded w-1/2" />
                  <div className="h-3 bg-surface-container rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest border border-outline-variant rounded-2xl">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">error_outline</span>
            <p className="text-on-surface-variant mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-user-primary-sm"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-surface-container-lowest border border-outline-variant rounded-2xl text-center">
            <span className="material-symbols-outlined text-6xl text-outline mb-6">favorite_border</span>
            <h2 className="font-headline-md text-on-surface mb-3">Chưa có sản phẩm yêu thích</h2>
            <p className="text-on-surface-variant mb-8">Khám phá và lưu các sản phẩm bạn quan tâm.</p>
            <Link to="/products" className="btn-user-primary-md">
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden hover:shadow-lg hover:border-secondary/40 transition-all group">
                <div className="relative h-52 overflow-hidden">
                  {getThumbnail(item) ? (
                    <img src={getThumbnail(item)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container">
                      <span className="material-symbols-outlined text-4xl text-outline">image</span>
                    </div>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    disabled={removingId === item.id}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-error hover:bg-error hover:text-white transition-all disabled:opacity-60"
                    aria-label="Bỏ khỏi yêu thích"
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {removingId === item.id ? 'hourglass_empty' : 'favorite'}
                    </span>
                  </button>
                </div>

                <div className="p-5">
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-medium text-on-surface hover:text-secondary transition-colors line-clamp-2">{item.name}</h3>
                  </Link>
                  {item.workshopName && <p className="text-xs text-on-surface-variant mt-1">By {item.workshopName}</p>}

                  {(item.averageRating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-sm font-bold text-on-surface">{Number(item.averageRating).toFixed(1)}</span>
                    </div>
                  )}

                  <p className="text-xs text-on-surface-variant mt-1">
                    {item.variants?.length ? `${item.variants.length} biến thể` : 'Sản phẩm đã lưu'}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-secondary">{fmt(item.basePrice)}</span>
                    <Link to={`/product/${item.id}`} className="btn-user-primary-sm">
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </CustomerLayout>
  );
};
