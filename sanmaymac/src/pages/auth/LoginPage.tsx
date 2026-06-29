import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services/endpoints/authService';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginPage = () => {
  const location = useLocation();
  const prefillEmail = (location.state as { email?: string })?.email ?? '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    authService
      .login(email, password)
      .then(() => {
        const user = useAuthStore.getState().user;
        if (user?.role === 'workshop') {
          navigate('/workshop/dashboard');
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || 'Đăng nhập thất bại');
      })
      .finally(() => setLoading(false));
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    setSocialLoading(provider);
    try {
      await authService.socialLogin(provider);
      const user = useAuthStore.getState().user;
      if (user?.role === 'workshop') {
        navigate('/workshop/dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Đăng nhập mạng xã hội thất bại');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <AuthLayout>
      <header className="mb-8">
        <h2 className="font-headline-lg text-on-surface mb-2">Đăng nhập Bách Xưởng</h2>
        <p className="text-on-surface-variant font-body-md">Chào mừng trở lại. Nhập thông tin để tiếp tục.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="font-label-sm text-on-surface-variant">Địa chỉ Email</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
              placeholder="example@email.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="font-label-sm text-on-surface-variant">Mật khẩu</label>
            <Link to="/auth/reset-password" virtual-href="/auth/reset-password" className="text-secondary text-xs hover:underline">Quên mật khẩu?</Link>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-4 btn-user-primary-lg rounded-lg"
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
        <div className="relative flex justify-center"><span className="bg-surface px-4 text-outline text-xs">HOẶC ĐĂNG NHẬP BẰNG</span></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={Boolean(socialLoading)}
          onClick={() => void handleSocialLogin('google')}
          className="flex items-center justify-center gap-2 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-60"
        >
          <span className="font-label-sm text-on-surface">
            {socialLoading === 'google' ? 'Đang xử lý...' : 'Google'}
          </span>
        </button>
        <button
          type="button"
          disabled={Boolean(socialLoading)}
          onClick={() => void handleSocialLogin('facebook')}
          className="flex items-center justify-center gap-2 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors disabled:opacity-60"
        >
          <span className="font-label-sm text-on-surface">
            {socialLoading === 'facebook' ? 'Đang xử lý...' : 'Facebook'}
          </span>
        </button>
      </div>

      <footer className="mt-8 pt-6 border-t border-outline-variant text-center">
        <div className="space-y-2">
          <p className="text-on-surface-variant font-body-md">
            Chưa có tài khoản?{' '}
            <Link to="/auth/register" virtual-href="/auth/register" className="text-secondary font-bold hover:underline ml-1">Đăng ký khách hàng</Link>
          </p>
          <p className="text-on-surface-variant text-xs">
            Bạn là xưởng may?{' '}
            <Link to="/auth/workshop-register" virtual-href="/auth/workshop-register" className="text-primary font-bold hover:underline ml-1">Đăng ký đối tác xưởng</Link>
          </p>
        </div>
      </footer>
    </AuthLayout>
  );
};
