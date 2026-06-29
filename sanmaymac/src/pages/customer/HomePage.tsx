import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CustomerLayout } from "../../layouts/CustomerLayout";
import {
  catalogService,
  Product,
  Category,
} from "../../services/endpoints/catalogService";
import {
  workshopService,
  PublicWorkshop,
} from "../../services/endpoints/workshopService";
import { cacheKeys, cacheService, cacheTtl } from "../../services/cache";
import anhXuongMay from "../../assets/img/peter.jpg";

// ── Fallback mock data (dùng khi API chưa có dữ liệu) ──────────────────────
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Áo thun Uniform 2024",
    workshopName: "Việt Tiến",
    basePrice: 350000,
    averageRating: 4.9,
    reviewCount: 128,
    categoryId: 1,
    workshopId: 1,
    createdAt: "",
    images: [
      {
        id: 1,
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDE2-K8q2wlC3u3xy4EwG44BCsLD8O9TBRYOPjTFwQrzQGLS5eGIPNidkrt9G2a0tJhbORl9oM9hcokbMNA1MQR2XNxcymuUDUxUYHg2_Mb8WW5a_cBC-TJnSGXB6cJ5ueLKKJ_ZsNYuiGGdqMRcAPlz1my6h-m08cxMEVCvsl9L4IOQVV7fbkXVhLEoj9JcbZIek5pbCN0TlHQxIiKiJn1_66orfUhCw57nwGgGpqdGbQsQyvLQkS8g9AhY5xD1-IquJOoFLZfhxE",
        isThumbnail: true,
      },
    ],
  },
  {
    id: 2,
    name: "Quần Chinos Slim-fit",
    workshopName: "Blue Ocean",
    basePrice: 550000,
    averageRating: 4.7,
    reviewCount: 94,
    categoryId: 2,
    workshopId: 2,
    createdAt: "",
    images: [
      {
        id: 2,
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCPk7NQnUyqwhIJ3SdZHpcGJi5XcCF4E8ryRnuld00sqoy0mcR-PjIaUnjCZzwm4wYpCvj4xZb_JDzaEySUjsj8ASW0iTt8BAjylFZDwSfbFKtvDySqT90Pdm2Us3iT4rvAHMvTjlCYHkO3LacLqOkhWRNK-QHx8Lk7LMgSys7B7bvDCpBWhvyr09yss8E1WdVTjHtXwXjENY8P60MQ_RBdff74d-VQOw4dhFu0ZD1jgamP9f_TGKK6Cshww8-2gHoFlj9ASDvmg6k",
        isThumbnail: true,
      },
    ],
  },
  {
    id: 3,
    name: "Váy Maxi Boho Collection",
    workshopName: "Thăng Long",
    basePrice: 480000,
    averageRating: 4.8,
    reviewCount: 76,
    categoryId: 3,
    workshopId: 3,
    createdAt: "",
    images: [
      {
        id: 3,
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAvyz_OyKNvmR7lZpNBz0w25KnHCpK9aZuTcibDA3vEsCFeUh7yyV7FRX_QF7FDYdo29bL5sqOvzHNFNXrrGQyRkR_yybydTIn0VM_yxn-dIya0TX0rSsLm-uQEiYj2v2iGtpih5M0ozVSQjKw_dw9LOaK7zT96G-9vqH3vAd3Ls0-LhC0GnAQilch5WwnyDZg2_CziRd6enauYeoRabephIwVjYXpsrcQQy1PMUHcBROnVHsxXqKsLR_4xFqXlsKxB4aH2ZrkxLN8",
        isThumbnail: true,
      },
    ],
  },
  {
    id: 4,
    name: "Đồng phục công ty Premium",
    workshopName: "Việt Tiến",
    basePrice: 420000,
    averageRating: 5.0,
    reviewCount: 163,
    categoryId: 1,
    workshopId: 1,
    createdAt: "",
    images: [
      {
        id: 4,
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDE2-K8q2wlC3u3xy4EwG44BCsLD8O9TBRYOPjTFwQrzQGLS5eGIPNidkrt9G2a0tJhbORl9oM9hcokbMNA1MQR2XNxcymuUDUxUYHg2_Mb8WW5a_cBC-TJnSGXB6cJ5ueLKKJ_ZsNYuiGGdqMRcAPlz1my6h-m08cxMEVCvsl9L4IOQVV7fbkXVhLEoj9JcbZIek5pbCN0TlHQxIiKiJn1_66orfUhCw57nwGgGpqdGbQsQyvLQkS8g9AhY5xD1-IquJOoFLZfhxE",
        isThumbnail: true,
      },
    ],
  },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "Áo thun" },
  { id: 2, name: "Quần" },
  { id: 3, name: "Váy" },
  { id: 4, name: "Đồng phục" },
  { id: 5, name: "Áo khoác" },
  { id: 6, name: "Thể thao" },
];

const MOCK_WORKSHOPS = [
  {
    id: 1,
    name: "Xưởng May Việt Tiến",
    location: "TP. Hồ Chí Minh",
    rating: 4.9,
    orders: 1240,
    speciality: "Đồng phục & Áo thun",
    verified: true,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtmv82IrPxVAAX5KcBAbIMuBWZkrRFmiIGGXd-Dn3FFK-jrO8MY3ReyUX_Gim8MqvVjccJeGCMQ1qsbFcdSojZk3FSMYoM4VQUW8BtlA4Pyy2Exg8139tG8qlaOdL40UV4Lh2DICCZncTpMLCx_7wuNJhwCUSKRxB5jRMTc5HJ6URik2St9Jwj3EeDC7Ucx_hsOlfQcVL0x_QKFACosQm-m5aggOiA-FLg_yq0c2cMvJ-fmtZSXocP-iBWl3PhijbP7EKoTEQ8ha8",
  },
  {
    id: 2,
    name: "Blue Ocean Garment",
    location: "Hà Nội",
    rating: 4.7,
    orders: 890,
    speciality: "Thời trang cao cấp",
    verified: true,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPk7NQnUyqwhIJ3SdZHpcGJi5XcCF4E8ryRnuld00sqoy0mcR-PjIaUnjCZzwm4wYpCvj4xZb_JDzaEySUjsj8ASW0iTt8BAjylFZDwSfbFKtvDySqT90Pdm2Us3iT4rvAHMvTjlCYHkO3LacLqOkhWRNK-QHx8Lk7LMgSys7B7bvDCpBWhvyr09yss8E1WdVTjHtXwXjENY8P60MQ_RBdff74d-VQOw4dhFu0ZD1jgamP9f_TGKK6Cshww8-2gHoFlj9ASDvmg6k",
  },
  {
    id: 3,
    name: "Thăng Long Fashion",
    location: "Đà Nẵng",
    rating: 4.8,
    orders: 670,
    speciality: "Váy & Thời trang nữ",
    verified: false,
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvyz_OyKNvmR7lZpNBz0w25KnHCpK9aZuTcibDA3vEsCFeUh7yyV7FRX_QF7FDYdo29bL5sqOvzHNFNXrrGQyRkR_yybydTIn0VM_yxn-dIya0TX0rSsLm-uQEiYj2v2iGtpih5M0ozVSQjKw_dw9LOaK7zT96G-9vqH3vAd3Ls0-LhC0GnAQilch5WwnyDZg2_CziRd6enauYeoRabephIwVjYXpsrcQQy1PMUHcBROnVHsxXqKsLR_4xFqXlsKxB4aH2ZrkxLN8",
  },
];

// ── Icon map cho category ───────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  "Áo thun": { icon: "checkroom", color: "bg-blue-50 text-blue-600" },
  Quần: { icon: "dry_cleaning", color: "bg-purple-50 text-purple-600" },
  Váy: { icon: "styler", color: "bg-pink-50 text-pink-600" },
  "Đồng phục": { icon: "badge", color: "bg-amber-50 text-amber-600" },
  "Áo khoác": { icon: "layers", color: "bg-green-50 text-green-600" },
  "Thể thao": { icon: "sports", color: "bg-red-50 text-red-600" },
};
const DEFAULT_ICON = { icon: "category", color: "bg-gray-50 text-gray-600" };

const fmt = (n: number) => n.toLocaleString("vi-VN") + "₫";

const getThumbnail = (product: Product) =>
  product.images?.find((i) => i.isThumbnail)?.imageUrl ??
  product.images?.[0]?.imageUrl ??
  "https://placehold.co/400x300?text=No+Image";

// ── Skeleton loader ────────────────────────────────────────────────────────
const ProductSkeleton = () => (
  <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden animate-pulse">
    <div className="h-52 bg-surface-container" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-surface-container rounded w-3/4" />
      <div className="h-3 bg-surface-container rounded w-1/2" />
      <div className="h-4 bg-surface-container rounded w-1/3 mt-3" />
    </div>
  </div>
);

// ── Component chính ────────────────────────────────────────────────────────
export const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workshops, setWorkshops] = useState<PublicWorkshop[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingWorkshops, setLoadingWorkshops] = useState(true);

  // Fetch sản phẩm nổi bật
  useEffect(() => {
    catalogService
      .getProducts({ page: 0, size: 4, sort: "createdAt,desc" })
      .then((res) => {
        const data = res.data.data?.content;
        setProducts(data?.length ? data : MOCK_PRODUCTS);
      })
      .catch(() => setProducts(MOCK_PRODUCTS))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Fetch danh mục
  useEffect(() => {
    const cachedCategories = cacheService.get<Category[]>(cacheKeys.categories);
    if (cachedCategories) {
      setCategories(
        cachedCategories.length ? cachedCategories : MOCK_CATEGORIES,
      );
      setLoadingCategories(false);
      return;
    }

    catalogService
      .getCategories()
      .then((res) => {
        const data = res.data.data;
        const categories = data?.length ? data : MOCK_CATEGORIES;
        setCategories(categories);
        cacheService.set(cacheKeys.categories, categories, cacheTtl.categories);
      })
      .catch(() => setCategories(MOCK_CATEGORIES))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Fetch xưởng nổi bật — top 3 theo rating
  useEffect(() => {
    workshopService
      .getPublicWorkshops({ page: 0, size: 3, sort: "ratingAvg,desc" })
      .then((res) => {
        const data = res.data.data?.content;
        setWorkshops(data?.length ? data : []);
      })
      .catch(() => setWorkshops([]))
      .finally(() => setLoadingWorkshops(false));
  }, []);

  return (
    <CustomerLayout>
      {/* ── HERO ── */}
      <section className="relative bg-primary overflow-hidden min-h-[520px]">
        <div className="absolute inset-0 opacity-20">
          <img
            src={anhXuongMay}
            alt="Ảnh đang bị lỗi"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 p-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-secondary text-white text-xs font-bold rounded-full mb-4 uppercase tracking-widest">
              Nền tảng may mặc #1 Việt Nam
            </span>
            <h1 className="text-white font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Kết nối xưởng may —<br />
              <span className="text-secondary-fixed">Tối ưu sản xuất</span>
            </h1>
            <p className="text-white/80 font-body-lg mb-10 max-w-lg">
              Tìm xưởng gia công uy tín, đặt hàng nhanh chóng và theo dõi tiến
              độ sản xuất theo thời gian thực.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/workshop-directory"
                className="btn-user-primary-md px-8 py-4 text-lg shadow-lg shadow-orange-500/30"
              >
                Tìm xưởng gia công
              </Link>
              <Link
                to="/create-tender"
                className="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Đăng yêu cầu gia công
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-5 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "5,000+", label: "Xưởng may" },
              { value: "100k+", label: "Mẫu thiết kế" },
              { value: "24/7", label: "Hỗ trợ AI" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-white font-bold text-xl md:text-2xl">
                  {s.value}
                </p>
                <p className="text-white/60 text-xs uppercase tracking-widest mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-on-surface">
            Danh mục sản phẩm
          </h2>
          <Link
            to="/products"
            className="text-secondary text-sm font-medium hover:underline flex items-center gap-1"
          >
            Xem tất cả{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-surface-container rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => {
              const { icon, color } = CATEGORY_ICONS[cat.name] ?? DEFAULT_ICON;
              return (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-outline-variant hover:border-secondary hover:shadow-md transition-all group"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {icon}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-on-surface text-center">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="bg-surface-container-lowest py-14">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">
                Sản phẩm nổi bật
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Được đặt hàng nhiều nhất tuần này
              </p>
            </div>
            <Link
              to="/products"
              className="text-secondary text-sm font-medium hover:underline flex items-center gap-1"
            >
              Xem tất cả{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {loadingProducts
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))
              : products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-outline-variant rounded-2xl overflow-hidden hover:shadow-lg hover:border-secondary/40 transition-all group"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={getThumbnail(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-medium text-on-surface text-sm line-clamp-2 hover:text-secondary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-on-surface-variant mt-1">
                        By {product.workshopName ?? "—"}
                      </p>
                      {(product.averageRating ?? 0) > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span
                            className="material-symbols-outlined text-amber-500 text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span className="text-xs font-bold text-on-surface">
                            {product.averageRating?.toFixed(1)}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            ({product.reviewCount ?? 0})
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-secondary text-sm">
                          {fmt(product.basePrice)}/cái
                        </span>
                        <Link
                          to="/cart"
                          className="p-2 bg-secondary-fixed rounded-full hover:bg-secondary text-secondary hover:text-white transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">
                            add_shopping_cart
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── BANNER CTA ── */}
      <section className="bg-secondary py-14">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-2">
              Có nhu cầu gia công số lượng lớn?
            </h2>
            <p className="text-white/80 font-body-md">
              Đăng yêu cầu và nhận báo giá từ hàng trăm xưởng trong 24 giờ.
            </p>
          </div>
          <Link
            to="/create-tender"
            className="flex-shrink-0 px-8 py-4 bg-white text-secondary font-bold rounded-xl hover:shadow-xl transition-all"
          >
            Đăng yêu cầu ngay
          </Link>
        </div>
      </section>

      {/* ── FEATURED WORKSHOPS ── */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">
              Xưởng may uy tín
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Được đánh giá cao bởi hàng nghìn khách hàng
            </p>
          </div>
          <Link
            to="/workshop-directory"
            className="text-secondary text-sm font-medium hover:underline flex items-center gap-1"
          >
            Xem tất cả{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingWorkshops
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 bg-surface-container rounded-2xl animate-pulse"
                />
              ))
            : (workshops.length ? workshops : MOCK_WORKSHOPS).map((ws) => {
                // Phân biệt real data vs mock
                const isReal = "shopName" in ws;
                const name = isReal
                  ? (ws as PublicWorkshop).shopName
                  : (ws as (typeof MOCK_WORKSHOPS)[0]).name;
                const rating = isReal
                  ? (ws as PublicWorkshop).ratingAvg
                  : (ws as (typeof MOCK_WORKSHOPS)[0]).rating;
                const verified = isReal
                  ? (ws as PublicWorkshop).isVerified
                  : (ws as (typeof MOCK_WORKSHOPS)[0]).verified;
                const address = isReal
                  ? (ws as PublicWorkshop).workshopAddress
                  : (ws as (typeof MOCK_WORKSHOPS)[0]).location;
                const desc = isReal
                  ? (ws as PublicWorkshop).description
                  : (ws as (typeof MOCK_WORKSHOPS)[0]).speciality;
                const avatar = isReal
                  ? (ws as PublicWorkshop).avatarUrl
                  : (ws as (typeof MOCK_WORKSHOPS)[0]).img;
                const capacity = isReal
                  ? (ws as PublicWorkshop).productionCapacity
                  : null;

                return (
                  <Link
                    key={ws.id}
                    to={`/workshop/${ws.id}`}
                    className="bg-surface border border-outline-variant rounded-2xl overflow-hidden hover:shadow-lg hover:border-secondary/40 transition-all group"
                  >
                    {/* Cover / Avatar */}
                    <div className="h-40 overflow-hidden relative bg-gradient-to-br from-primary/10 to-secondary/10">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-6xl text-primary/30">
                            factory
                          </span>
                        </div>
                      )}
                      {verified && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 text-secondary text-xs font-bold px-2 py-1 rounded-full">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            verified
                          </span>
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                        {name}
                      </h3>
                      {address && (
                        <div className="flex items-center gap-1 mt-1 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-sm">
                            location_on
                          </span>
                          <span className="line-clamp-1">{address}</span>
                        </div>
                      )}
                      {desc && (
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                          {desc}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant">
                        <div className="flex items-center gap-1">
                          <span
                            className="material-symbols-outlined text-amber-500 text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span className="text-sm font-bold text-on-surface">
                            {rating ? Number(rating).toFixed(1) : "—"}
                          </span>
                        </div>
                        {capacity ? (
                          <span className="text-xs text-on-surface-variant">
                            {capacity.toLocaleString()} sp/tháng
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">
                            {(
                              ws as (typeof MOCK_WORKSHOPS)[0]
                            ).orders?.toLocaleString()}{" "}
                            đơn
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-surface-container-lowest py-14">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-on-surface mb-2">
              Cách hoạt động
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Chỉ 3 bước để bắt đầu đặt hàng gia công
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "search",
                title: "Tìm xưởng phù hợp",
                desc: "Duyệt qua hàng nghìn xưởng may được xác minh, lọc theo vị trí, chuyên môn và đánh giá.",
              },
              {
                step: "02",
                icon: "description",
                title: "Gửi yêu cầu báo giá",
                desc: "Mô tả sản phẩm, số lượng và yêu cầu kỹ thuật. Nhận báo giá chi tiết trong vòng 24 giờ.",
              },
              {
                step: "03",
                icon: "local_shipping",
                title: "Theo dõi & nhận hàng",
                desc: "Theo dõi tiến độ sản xuất theo thời gian thực và nhận hàng đúng hẹn.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center p-6"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      {item.icon}
                    </span>
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-on-surface mb-2">{item.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
};
