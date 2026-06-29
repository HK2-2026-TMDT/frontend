import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services/endpoints/authService';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [registered, setRegistered] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    authService
      .register(form.email, form.password, form.fullName)
      .then(() => setRegistered(true))
      .catch((err) => setError(err?.response?.data?.message || 'Đăng ký thất bại'))
      .finally(() => setLoading(false));
  };

  const handleSocialRegister = async (provider: 'google' | 'facebook') => {
    setError(null);
    setSocialLoading(provider);
    try {
      await authService.socialLogin(provider);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Đăng ký bằng mạng xã hội thất bại');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full space-y-8">
        <header className="mb-8">
          <h2 className="font-headline-lg text-on-surface mb-2">Tạo tài khoản</h2>
          <p className="text-on-surface-variant font-body-md">Tham gia mạng lưới may mặc lớn nhất Việt Nam</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Họ và tên</label>
              <input value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} type="text" required className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Email</label>
              <input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} type="email" required className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Mật khẩu</label>
              <input value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} type="password" required className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading || registered} className="w-full btn-user-primary-lg rounded-xl">
            {loading ? 'Đang đăng ký...' : registered ? 'Đã gửi email xác thực' : 'Đăng ký thành viên'}
          </button>

          {error && <p className="text-sm text-error mt-2">{error}</p>}

          {registered && (
            <div className="mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant">
              <h3 className="font-bold">Đăng ký thành công</h3>
              <p className="text-sm text-on-surface-variant mt-2">Vui lòng kiểm tra email <strong>{form.email}</strong> và bấm vào liên kết xác thực để kích hoạt tài khoản.</p>
              <p className="text-sm text-on-surface-variant mt-2">Nếu không thấy email, kiểm tra mục Spam hoặc thử gửi lại sau vài phút.</p>
            </div>
          )}

          {registered && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/auth/login', { state: { email: form.email } })}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                Đã xác thực — Đăng nhập ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  authService
                    .resendVerification(form.email)
                    .then(() => alert('Email xác thực đã được gửi lại.'))
                    .catch((err) => alert(err?.response?.data?.message || 'Không thể gửi lại email'))
                    .finally(() => setLoading(false));
                }}
                className="px-4 py-3 border border-outline-variant rounded-xl font-medium text-sm hover:bg-surface-container transition-all"
              >
                Gửi lại email
              </button>
            </div>
          )}

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-on-surface-variant font-bold">Hoặc tiếp tục với</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={Boolean(socialLoading)}
              onClick={() => void handleSocialRegister('google')}
              className="flex items-center justify-center py-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-all disabled:opacity-60"
            >
              <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5 mr-2" alt="Google" />
              <span className="text-xs font-bold">{socialLoading === 'google' ? 'Đang xử lý...' : 'Google'}</span>
            </button>
            <button
              type="button"
              disabled={Boolean(socialLoading)}
              onClick={() => void handleSocialRegister('facebook')}
              className="flex items-center justify-center py-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-all disabled:opacity-60"
            >
              <img src="https://www.svgrepo.com/show/448224/facebook.svg" className="w-5 h-5 mr-2" alt="Facebook" />
              <span className="text-xs font-bold">{socialLoading === 'facebook' ? 'Đang xử lý...' : 'Facebook'}</span>
            </button>
          </div>
        </form>

        <footer className="mt-8 pt-6 border-t border-outline-variant text-center">
          <div className="space-y-2">
            <p className="text-on-surface-variant font-body-md">
              Đã có tài khoản?{' '}
              <Link to="/auth/login" virtual-href="/auth/login" className="font-bold text-primary hover:underline ml-1">Đăng nhập ngay</Link>
            </p>
            <p className="text-xs text-on-surface-variant">
              Bạn là xưởng may?{' '}
              <Link to="/auth/workshop-register" virtual-href="/auth/workshop-register" className="font-bold text-secondary hover:underline ml-1">Hợp tác cùng Bách Xưởng</Link>
            </p>
          </div>
        </footer>
      </div>
    </AuthLayout>
  );
};
