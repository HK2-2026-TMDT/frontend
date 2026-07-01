import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  adminComplaintService,
  complaintStatusLabel,
  type Complaint,
  type ComplaintStatus,
} from '../../services/endpoints/complaintService';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'ESCALATED', label: 'Chuyển tranh chấp' },
];

export const AdminComplaintManagementPage = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('PROCESSING');
  const [adminNote, setAdminNote] = useState('');

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminComplaintService.list({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as ComplaintStatus),
        page: 0,
        size: 50,
      });
      setComplaints(response.data.data?.content ?? []);
    } catch (loadError) {
      setComplaints([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách khiếu nại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, [statusFilter]);

  const openDetail = async (complaint: Complaint) => {
    setSelected(complaint);
    setNewStatus(complaint.status === 'ESCALATED' ? 'PROCESSING' : complaint.status);
    setAdminNote(complaint.adminNote ?? '');
    try {
      const response = await adminComplaintService.get(complaint.id);
      setSelected(response.data.data ?? complaint);
    } catch {
      setSelected(complaint);
    }
  };

  const updateStatus = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const response = await adminComplaintService.updateStatus(selected.id, {
        status: newStatus,
        adminNote: adminNote.trim() || undefined,
      });
      setSelected(response.data.data ?? null);
      await loadComplaints();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setSaving(false);
    }
  };

  const escalate = async () => {
    if (!selected) return;
    if (!window.confirm('Chuyển khiếu nại này sang tranh chấp?')) return;
    setSaving(true);
    setError(null);
    try {
      await adminComplaintService.escalate(selected.id);
      await loadComplaints();
      const refreshed = await adminComplaintService.get(selected.id);
      setSelected(refreshed.data.data ?? null);
    } catch (escalateError) {
      setError(escalateError instanceof Error ? escalateError.message : 'Không thể chuyển tranh chấp.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="font-headline-md text-slate-900 text-3xl">Quản lý khiếu nại</h1>
          <p className="text-slate-500 font-body-md mt-1">Xem danh sách, chi tiết và cập nhật trạng thái khiếu nại từ khách hàng.</p>
        </header>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button onClick={() => void loadComplaints()} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">
            Tải lại
          </button>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">Danh sách khiếu nại</div>
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Đang tải…</p>
            ) : complaints.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Chưa có khiếu nại nào.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {complaints.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void openDetail(item)}
                      className={`w-full text-left px-6 py-4 hover:bg-slate-50 ${selected?.id === item.id ? 'bg-slate-50' : ''}`}
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">Đơn #{item.orderId}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.workshopName ?? `Xưởng #${item.workshopId}`}</p>
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.reason}</p>
                        </div>
                        <span className="text-xs font-bold uppercase text-amber-700 bg-amber-50 px-2 py-1 rounded-lg h-fit">
                          {complaintStatusLabel[item.status]}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">Chi tiết khiếu nại</h2>
            {!selected ? (
              <p className="text-sm text-slate-500">Chọn một khiếu nại để xem chi tiết.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Mã khiếu nại:</span> #{selected.id}</div>
                  <div><span className="text-slate-500">Đơn hàng:</span> #{selected.orderId}</div>
                  <div><span className="text-slate-500">Khách hàng:</span> {selected.customerName ?? `#${selected.customerId}`}</div>
                  <div><span className="text-slate-500">Xưởng:</span> {selected.workshopName ?? `#${selected.workshopId}`}</div>
                  <div><span className="text-slate-500">Trạng thái:</span> {complaintStatusLabel[selected.status]}</div>
                  {selected.disputeId ? (
                    <div>
                      <span className="text-slate-500">Tranh chấp:</span>{' '}
                      <Link to="/admin/disputes" className="text-primary font-semibold hover:underline">
                        #{selected.disputeId}
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Lý do</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{selected.reason}</p>
                </div>

                {selected.imageUrls?.length ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Hình ảnh</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.imageUrls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="Minh chứng" className="h-24 w-24 rounded-lg object-cover border border-slate-200" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selected.status !== 'ESCALATED' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">Cập nhật trạng thái</p>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="PENDING">Chờ xử lý</option>
                      <option value="PROCESSING">Đang xử lý</option>
                      <option value="RESOLVED">Đã giải quyết</option>
                      <option value="REJECTED">Từ chối</option>
                    </select>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                      placeholder="Ghi chú phản hồi cho khách hàng..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void updateStatus()}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                        Lưu trạng thái
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void escalate()}
                        className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                        Chuyển tranh chấp
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 font-medium">Khiếu nại đã chuyển sang tranh chấp. Xử lý tại trang Quản lý tranh chấp.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
