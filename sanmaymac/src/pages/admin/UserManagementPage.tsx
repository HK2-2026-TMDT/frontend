import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminService, type AdminUser } from '../../services/endpoints/adminService';

export const AdminUserManagementPage = () => {
  const [activeRole, setActiveRole] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.searchUsers({
        keyword: keyword.trim() || undefined,
        role: activeRole === 'ALL' ? undefined : activeRole,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: 0,
        size: 100,
        sort: 'id,desc',
      });
      setUsers(response.data.data?.content ?? []);
      setTotal(response.data.data?.totalElements ?? 0);
    } catch (loadError) {
      setUsers([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [activeRole, statusFilter]);

  const updateStatus = async (userId: number, status: string) => {
    setSavingId(userId);
    setError(null);
    try {
      await adminService.updateUserStatus(userId, status);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setSavingId(null);
    }
  };

  const updateRole = async (userId: number, role: string) => {
    setSavingId(userId);
    setError(null);
    try {
      await adminService.updateUserRole(userId, role);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật vai trò.');
    } finally {
      setSavingId(null);
    }
  };

  const visibleUsers = useMemo(() => users, [users]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-headline-md text-slate-900 text-3xl">Quản lý người dùng</h1>
            <p className="text-slate-500 font-body-md mt-1">Quản trị danh sách người dùng, phân quyền và trạng thái tài khoản.</p>
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 opacity-60 cursor-not-allowed" disabled>
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Quản trị qua endpoint /auth/register/admin
          </button>
        </header>

        {/* FILTERS */}
        <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
            {['ALL', 'CUSTOMER', 'WORKSHOP', 'ADMIN'].map(role => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={'px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ' + (activeRole === role ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300')}
              >
                {role}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="UNVERIFIED">UNVERIFIED</option>
            <option value="LOCKED">LOCKED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
            <option value="BANNED">BANNED</option>
          </select>
          <div className="relative w-full lg:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadUsers();
              }}
              placeholder="Tìm theo tên, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
          <button onClick={() => void loadUsers()} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">
            Tìm
          </button>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        {/* USERS TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vai trò</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngày gia nhập</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-500" colSpan={5}>Đang tải dữ liệu...</td>
                </tr>
              ) : visibleUsers.length ? visibleUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        {(u.fullName || u.email || '#').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.fullName || 'Chưa cập nhật tên'}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={'px-3 py-1 rounded-full text-[10px] font-bold ' + (
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'WORKSHOP' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    )}>
                      {u.role || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={'w-2 h-2 rounded-full ' + (u.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500')}></span>
                      <span className="text-xs font-medium text-slate-700">{u.status || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <select
                        value={u.role || 'CUSTOMER'}
                        disabled={savingId === u.id}
                        onChange={(event) => void updateRole(u.id, event.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="WORKSHOP">WORKSHOP</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <select
                        value={u.status || 'ACTIVE'}
                        disabled={savingId === u.id}
                        onChange={(event) => void updateStatus(u.id, event.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="UNVERIFIED">UNVERIFIED</option>
                        <option value="LOCKED">LOCKED</option>
                        <option value="DEACTIVATED">DEACTIVATED</option>
                        <option value="BANNED">BANNED</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-500" colSpan={5}>Không có dữ liệu.</td>
                </tr>
              )}
            </tbody>
          </table>
          <footer className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <p className="text-xs text-slate-500">Tổng người dùng tìm thấy: {total.toLocaleString('vi-VN')}</p>
          </footer>
        </div>
      </div>
    </AdminLayout>
  );
};
