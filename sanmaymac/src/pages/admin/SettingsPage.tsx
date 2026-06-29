import React from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';

export const AdminSettingsPage = () => {
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="font-headline-md text-slate-900 text-3xl">Cấu hình hệ thống</h1>
          <p className="text-slate-500 font-body-md mt-1">Quản lý các thiết lập chung, cổng thanh toán và thông số vận hành toàn sàn.</p>
        </header>

        <div className="space-y-6">
          {/* GENERAL SETTINGS */}
          <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings</span>
              Thiết lập chung
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên nền tảng</label>
                <input type="text" defaultValue="Bách Xưởng Manufacturing" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email quản trị</label>
                <input type="email" defaultValue="admin@bachxuong.vn" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
            </div>
          </section>

          {/* FINANCIAL SETTINGS */}
          <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Cấu hình tài chính
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phí dịch vụ hệ thống (%)</label>
                <input type="number" defaultValue="2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số tiền rút tối thiểu</label>
                <input type="text" defaultValue="500,000 đ" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
            </div>
          </section>

          {/* MAINTENANCE */}
          <section className="bg-red-50 border border-red-100 rounded-3xl p-8 space-y-6">
            <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Bảo trì & Bảo mật
            </h3>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-red-100">
              <div>
                <p className="text-sm font-bold text-slate-900">Chế độ bảo trì (Maintenance Mode)</p>
                <p className="text-xs text-slate-500">Tạm dừng toàn bộ hoạt động của người dùng để cập nhật hệ thống.</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-slate-200 rounded-full cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 transform translate-x-0"></div>
              </div>
            </div>
            <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock_reset</span>
              Xóa toàn bộ cache hệ thống
            </button>
          </section>
        </div>

        <div className="pt-6 flex justify-end gap-3">
          <button className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">Khôi phục mặc định</button>
          <button className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">Lưu cấu hình</button>
        </div>
      </div>
    </AdminLayout>
  );
};
