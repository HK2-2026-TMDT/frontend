import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary pt-20 pb-12 border-t border-outline text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop max-w-container-max mx-auto">
        {/* Brand Info */}
        <div className="col-span-1">
          <div className="font-headline-md text-headline-md text-on-primary mb-6">Bách Xưởng</div>
          <p className="font-body-md text-surface-variant mb-6 opacity-80">
            Nền tảng kết nối sản xuất may mặc quy mô lớn. Mang công nghệ vào quy trình gia công truyền thống.
          </p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center hover:bg-secondary-container transition-colors" href="#">
              <span className="material-symbols-outlined text-sm">public</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center hover:bg-secondary-container transition-colors" href="#">
              <span className="material-symbols-outlined text-sm">alternate_email</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center hover:bg-secondary-container transition-colors" href="#">
              <span className="material-symbols-outlined text-sm">share</span>
            </a>
          </div>
        </div>

        {/* Column 1 */}
        <div>
          <h6 className="font-label-sm text-secondary-container mb-6 uppercase tracking-wider">Về chúng tôi</h6>
          <ul className="space-y-4 font-body-md text-surface-variant">
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/about">Giới thiệu</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/process">Quy trình xưởng</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/careers">Tuyển dụng</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/sustainability">Sustainability Report</Link></li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h6 className="font-label-sm text-secondary-container mb-6 uppercase tracking-wider">Cho khách hàng</h6>
          <ul className="space-y-4 font-body-md text-surface-variant">
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/create-tender">Đăng yêu cầu gia công</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/products">Mua mẫu sản phẩm</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/orders">Quản lý đơn hàng</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/payment-policy">Chính sách thanh toán</Link></li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h6 className="font-label-sm text-secondary-container mb-6 uppercase tracking-wider">Hỗ trợ</h6>
          <ul className="space-y-4 font-body-md text-surface-variant">
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/help">Trung tâm trợ giúp</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/terms">Điều khoản dịch vụ</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-secondary-fixed transition-colors" to="/partner">Partner Portal</Link></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-20 pt-8 border-t border-outline-variant/20 px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-body-md text-surface-variant opacity-60 text-sm">© 2024 Bách Xưởng Manufacturing. Professional Precision at Scale.</p>
        <div className="flex gap-6 text-[12px] text-surface-variant opacity-60 uppercase tracking-widest">
          <span>Made in Vietnam</span>
          <span>Factory 4.0 Standard</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
