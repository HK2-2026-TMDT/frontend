import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminService, type WorkshopPublic } from '../../services/endpoints/adminService';

export const AdminWorkshopAuditPage = () => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadWorkshops = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.listWorkshopsPublic({
        verifiedOnly: false,
        page: 0,
        size: 200,
      });
      setWorkshops(response.data.data?.content ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách xưởng.');
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkshops();
  }, []);

  const filteredWorkshops = useMemo(() => {
    if (activeTab === 'APPROVED') {
      return workshops.filter((item) => item.isVerified);
    }
    return workshops.filter((item) => !item.isVerified);
  }, [activeTab, workshops]);

  const stats = useMemo(
    () => ({
      pending: workshops.filter((item) => !item.isVerified).length,
      approved: workshops.filter((item) => item.isVerified).length,
    }),
    [workshops]
  );

  const vettingWorkshop = async (workshopId: number, approved: boolean) => {
    const adminNote = approved ? 'Phê duyệt từ trang quản trị' : 'Từ chối từ trang quản trị';
    setSavingId(workshopId);
    setError(null);
    try {
      await adminService.vettingWorkshop(workshopId, approved, adminNote);
      await loadWorkshops();
    } catch (vettingError) {
      setError(vettingError instanceof Error ? vettingError.message : 'Không thể cập nhật trạng thái kiểm duyệt.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="font-headline-md text-slate-900 text-3xl">Kiểm duyệt xưởng may</h1>
          <p className="text-slate-500 font-body-md mt-1">Phê duyệt và xác thực năng lực các đối tác xưởng may mới gia nhập hệ thống.</p>
        </header>

        {/* TABS */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 inline-flex">
          {[
            { id: 'PENDING', label: 'Chờ duyệt', count: stats.pending },
            { id: 'APPROVED', label: 'Đã phê duyệt', count: stats.approved },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
              <span className="ml-2 opacity-50">({tab.count})</span>
            </button>
          ))}
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        {/* WORKSHOP LIST */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Đang tải dữ liệu...</div>
          ) : filteredWorkshops.length ? filteredWorkshops.map(w => (
            <div key={w.id} className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-primary transition-all group flex flex-col md:flex-row gap-8 shadow-sm">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-widest">WS-{w.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${w.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {w.isVerified ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-1">{w.shopName || `Xưởng #${w.id}`}</h3>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">person</span>
                    Chủ xưởng: <span className="font-bold text-slate-700">{w.fullName || 'Chưa cập nhật'}</span> · 
                    <span className="material-symbols-outlined text-sm ml-2">location_on</span>
                    {w.workshopAddress || 'Chưa cập nhật địa chỉ'}
                  </p>
                </div>
                <div className="flex gap-2 text-xs text-slate-500">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                    Công suất: {w.productionCapacity ?? 0} sản phẩm/ngày
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    Điểm đánh giá: {Number(w.ratingAvg ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 min-w-[200px]">
                <button
                  disabled={savingId === w.id || w.isVerified}
                  onClick={() => void vettingWorkshop(w.id, true)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Phê duyệt
                </button>
                <button
                  disabled={savingId === w.id || !w.isVerified}
                  onClick={() => void vettingWorkshop(w.id, false)}
                  className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  Hủy duyệt
                </button>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Không có xưởng phù hợp bộ lọc.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
