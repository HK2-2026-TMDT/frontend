import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services/endpoints/authService';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!token) {
      setError('Token reset không tồn tại');
      return;
    }
    setLoading(true);
    authService
      .resetPassword(token, formData.password)
      .then(() => navigate('/auth/login'))
      .catch((err) => setError(err?.response?.data?.message || 'Không thể đặt lại mật khẩu'))
      .finally(() => setLoading(false));
  };

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto w-full">
        <header className="mb-10 text-center lg:text-left">
          <h2 className="font-headline-lg text-primary text-4xl mb-3">Đặt lại mật khẩu</h2>
          <p className="font-body-md text-on-surface-variant">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-label-sm text-on-surface-variant">Mật khẩu mới</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
                lock
              </span>
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 h-14 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label-sm text-on-surface-variant">Xác nhận mật khẩu</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
                lock_reset
              </span>
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 h-14 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-14 btn-user-primary-lg rounded-xl text-lg"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-error">{error}</p>}

        <footer className="mt-12 text-center">
          <button 
            onClick={() => navigate('/auth/login')}
            className="text-secondary font-bold hover:underline transition-all"
          >
            Quay lại đăng nhập
          </button>
        </footer>
      </div>
    </AuthLayout>
  );
};
