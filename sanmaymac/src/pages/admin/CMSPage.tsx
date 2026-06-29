import React from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';

export const AdminCMSPage = () => {
  const contentItems = [
    { id: 'CMS-01', title: 'Banner Trang chủ - Teambuilding 2024', type: 'BANNER', status: 'ACTIVE', lastUpdate: '10/10/2024' },
    { id: 'CMS-05', title: 'Top 10 xưởng may uy tín tháng 10', type: 'BLOG', status: 'DRAFT', lastUpdate: '08/10/2024' },
    { id: 'CMS-08', title: 'Chính sách bảo mật mới', type: 'PAGE', status: 'ACTIVE', lastUpdate: '01/10/2024' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="font-headline-md text-slate-900 text-3xl">Quản trị nội dung CMS</h1>
            <p className="text-slate-500 font-body-md mt-1">Cập nhật banner, bài viết blog và các trang thông tin hệ thống.</p>
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Tạo nội dung mới
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Bài viết blog', count: 124, icon: 'article', color: 'text-blue-600' },
            { label: 'Banner quảng cáo', count: 8, icon: 'ad_units', color: 'text-purple-600' },
            { label: 'Trang tĩnh (FAQ, Terms)', count: 12, icon: 'description', color: 'text-amber-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${stat.color}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiêu đề nội dung</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cập nhật cuối</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contentItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-600">{item.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{item.lastUpdate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                      <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-all"><span className="material-symbols-outlined text-sm">visibility</span></button>
                      <button className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
