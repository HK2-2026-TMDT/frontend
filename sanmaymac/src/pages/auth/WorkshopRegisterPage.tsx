import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services/endpoints/authService';

export const WorkshopRegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Tài khoản
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    // Thông tin xưởng
    shopName: '',
    workshopAddress: '',
    productionCapacity: '',
    description: '',
    // Pháp lý & ngân hàng
    taxCode: '',
    bankName: '',
    bankAccountNo: '',
    bankAccountName: '',
    agreeTerms: false,
  });

  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    authService
      .registerWorkshop({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        shopName: formData.shopName,
        workshopAddress: formData.workshopAddress,
        productionCapacity: Number(formData.productionCapacity) || 0,
        description: formData.description || undefined,
        taxCode: formData.taxCode || undefined,
        bankName: formData.bankName || undefined,
        bankAccountNo: formData.bankAccountNo || undefined,
        bankAccountName: formData.bankAccountName || undefined,
      })
      .then(() => setRegistered(true))
      .catch((err) => {
        if (err?.response?.status === 409) {
          setError('Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.');
        } else {
          setError(err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
      })
      .finally(() => setLoading(false));
  };

  const inputCls = 'w-full px-4 h-12 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all';
  const labelCls = 'block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5';

  return (
    <AuthLayout>
      <div className="w-full">
        <header className="mb-8">
          <h2 className="font-headline-lg text-on-surface mb-2">Đăng ký Đối tác Xưởng</h2>
          <p className="text-on-surface-variant font-body-md">
            Mở rộng cơ hội kinh doanh và tiếp cận hàng ngàn đơn hàng mới mỗi ngày.
          </p>
        </header>

        {registered ? (
          /* ── Thành công ── */
          <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-secondary text-2xl">mark_email_read</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">Đăng ký thành công!</h3>
                <p className="text-sm text-on-surface-variant">Hồ sơ xưởng đã được ghi nhận.</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant">
              Vui lòng kiểm tra email <strong>{formData.email}</strong> và bấm vào liên kết xác thực để kích hoạt tài khoản.
            </p>
            <p className="text-sm text-on-surface-variant">
              Nếu không thấy email, kiểm tra mục Spam hoặc thử gửi lại sau vài phút.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/auth/login', { state: { email: formData.email } })}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              >
                Đã xác thực — Đăng nhập ngay
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  authService
                    .resendVerification(formData.email)
                    .then(() => alert('Email xác thực đã được gửi lại.'))
                    .catch((err) => alert(err?.response?.data?.message || 'Không thể gửi lại email'))
                    .finally(() => setLoading(false));
                }}
                className="px-4 py-3 border border-outline-variant rounded-xl font-medium text-sm hover:bg-surface-container transition-all disabled:opacity-50"
              >
                Gửi lại email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── PHẦN 1: Tài khoản ── */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">account_circle</span>
                Thông tin tài khoản
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Họ và tên *</label>
                    <input type="text" required value={formData.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                      className={inputCls} placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className={labelCls}>Số điện thoại *</label>
                    <input type="tel" required value={formData.phoneNumber}
                      onChange={(e) => set('phoneNumber', e.target.value)}
                      className={inputCls} placeholder="0901 234 567" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => set('email', e.target.value)}
                    className={inputCls} placeholder="contact@xuongmay.com" />
                </div>
                <div>
                  <label className={labelCls}>Mật khẩu *</label>
                  <input type="password" required minLength={6} value={formData.password}
                    onChange={(e) => set('password', e.target.value)}
                    className={inputCls} placeholder="Tối thiểu 6 ký tự" />
                </div>
              </div>
            </section>

            {/* ── PHẦN 2: Thông tin xưởng ── */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">factory</span>
                Thông tin xưởng may
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Tên xưởng may *</label>
                  <input type="text" required value={formData.shopName}
                    onChange={(e) => set('shopName', e.target.value)}
                    className={inputCls} placeholder="Xưởng May Việt Tiến" />
                </div>
                <div>
                  <label className={labelCls}>Địa chỉ xưởng *</label>
                  <input type="text" required value={formData.workshopAddress}
                    onChange={(e) => set('workshopAddress', e.target.value)}
                    className={inputCls} placeholder="123 Nguyễn Trãi, Q1, TP.HCM" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Năng lực sản xuất (sp/tháng) *</label>
                    <select required value={formData.productionCapacity}
                      onChange={(e) => set('productionCapacity', e.target.value)}
                      className={inputCls}>
                      <option value="">Chọn quy mô</option>
                      <option value="500">Dưới 1.000 sản phẩm</option>
                      <option value="3000">1.000 – 5.000 sản phẩm</option>
                      <option value="12000">5.000 – 20.000 sản phẩm</option>
                      <option value="25000">Trên 20.000 sản phẩm</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Mã số thuế</label>
                    <input type="text" value={formData.taxCode}
                      onChange={(e) => set('taxCode', e.target.value)}
                      className={inputCls} placeholder="TAX001" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mô tả xưởng</label>
                  <textarea value={formData.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all resize-none"
                    placeholder="Chuyên may áo thun, đồng phục, số lượng lớn..." />
                </div>
              </div>
            </section>

            {/* ── PHẦN 3: Ngân hàng ── */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">account_balance</span>
                Thông tin ngân hàng <span className="text-outline normal-case font-normal">(không bắt buộc)</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Ngân hàng</label>
                    <input type="text" value={formData.bankName}
                      onChange={(e) => set('bankName', e.target.value)}
                      className={inputCls} placeholder="Vietcombank" />
                  </div>
                  <div>
                    <label className={labelCls}>Số tài khoản</label>
                    <input type="text" value={formData.bankAccountNo}
                      onChange={(e) => set('bankAccountNo', e.target.value)}
                      className={inputCls} placeholder="1234567890" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tên chủ tài khoản</label>
                  <input type="text" value={formData.bankAccountName}
                    onChange={(e) => set('bankAccountName', e.target.value)}
                    className={inputCls} placeholder="NGUYEN VAN A" />
                </div>
              </div>
            </section>

            {/* ── Điều khoản ── */}
            <div className="flex items-start gap-3">
              <input type="checkbox" id="terms" required
                checked={formData.agreeTerms}
                onChange={(e) => set('agreeTerms', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary flex-shrink-0" />
              <label htmlFor="terms" className="text-sm text-on-surface-variant">
                Tôi cam kết cung cấp thông tin chính xác và đồng ý với{' '}
                <a href="#" className="text-secondary font-bold hover:underline">Chính sách đối tác</a>{' '}
                của Bách Xưởng.
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error/8 border border-error/20 rounded-xl">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-14 bg-secondary-container text-white rounded-xl font-bold text-base hover:bg-secondary hover:shadow-lg transition-all disabled:opacity-60">
              {loading ? 'Đang đăng ký...' : 'Đăng ký trở thành Đối tác'}
            </button>
          </form>
        )}

        <footer className="mt-8 pt-6 border-t border-outline-variant text-center space-y-2">
          <p className="text-sm text-on-surface-variant">
            Bạn là khách hàng cá nhân?{' '}
            <Link to="/auth/register" className="text-secondary font-bold hover:underline">Đăng ký tại đây</Link>
          </p>
          <p className="text-sm text-on-surface-variant">
            Đã có tài khoản?{' '}
            <Link to="/auth/login" className="text-primary font-bold hover:underline">Đăng nhập ngay</Link>
          </p>
        </footer>
      </div>
    </AuthLayout>
  );
};
