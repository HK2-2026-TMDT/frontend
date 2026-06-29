import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminService, type PayoutItem } from '../../services/endpoints/adminService';

export const AdminWithdrawalManagementPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [withdrawals, setWithdrawals] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.listAdminPayouts(statusFilter === 'ALL' ? undefined : statusFilter);
      setWithdrawals(response.data.data ?? []);
    } catch (loadError) {
      setWithdrawals([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách yêu cầu rút tiền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayouts();
  }, [statusFilter]);

  const approve = async (payoutId: number) => {
    setSavingId(payoutId);
    setError(null);
    try {
      await adminService.approvePayout(payoutId, 'Phê duyệt từ trang admin');
      await loadPayouts();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Không thể phê duyệt yêu cầu.');
    } finally {
      setSavingId(null);
    }
  };

  const reject = async (payoutId: number) => {
    const note = window.prompt('Nhập ghi chú từ chối', 'Không đủ điều kiện giải ngân') ?? '';
    setSavingId(payoutId);
    setError(null);
    try {
      await adminService.rejectPayout(payoutId, note);
      await loadPayouts();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Không thể từ chối yêu cầu.');
    } finally {
      setSavingId(null);
    }
  };

  const stats = useMemo(() => {
    const pendingAmount = withdrawals
      .filter((item) => item.status === 'PENDING')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const approvedAmount = withdrawals
      .filter((item) => item.status === 'APPROVED')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const approvedCount = withdrawals.filter((item) => item.status === 'APPROVED').length;
    const totalCount = withdrawals.length || 1;
    return {
      pendingAmount,
      approvedAmount,
      approveRate: ((approvedCount / totalCount) * 100).toFixed(1),
    };
  }, [withdrawals]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="font-headline-md text-slate-900 text-3xl">Yêu cầu rút tiền</h1>
          <p className="text-slate-500 font-body-md mt-1">Quản lý và phê duyệt các yêu cầu rút tiền từ tài khoản đối tác xưởng.</p>
        </header>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button onClick={() => void loadPayouts()} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">
            Tải lại
          </button>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Tổng tiền chờ duyệt</p>
            <h2 className="text-2xl font-bold">{stats.pendingAmount.toLocaleString('vi-VN')} đ</h2>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Đã giải ngân (tháng này)</p>
            <h2 className="text-2xl font-bold text-slate-900">{stats.approvedAmount.toLocaleString('vi-VN')} đ</h2>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Tỷ lệ phê duyệt</p>
            <h2 className="text-2xl font-bold text-green-600">{stats.approveRate}%</h2>
          </div>
        </div>

        {/* WITHDRAWALS TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mã yêu cầu</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đối tác</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngân hàng</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số tiền</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngày yêu cầu</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-500" colSpan={7}>Đang tải dữ liệu...</td>
                </tr>
              ) : withdrawals.length ? withdrawals.map(wd => (
                <tr key={wd.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-5 font-mono-label text-slate-500 text-sm">WD-{wd.id}</td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-900">Xưởng #{wd.workshopId}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-slate-700">-</p>
                    <p className="text-[10px] text-slate-400 font-mono">Chưa có dữ liệu ngân hàng từ endpoint này</p>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-900 text-sm">
                    {Number(wd.amount || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500">{wd.createdAt ? new Date(wd.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      wd.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      wd.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      wd.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {wd.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {wd.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={savingId === wd.id}
                          onClick={() => void approve(wd.id)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                          Phê duyệt
                        </button>
                        <button
                          disabled={savingId === wd.id}
                          onClick={() => void reject(wd.id)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-500" colSpan={7}>Không có dữ liệu yêu cầu rút tiền.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
