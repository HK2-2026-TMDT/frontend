import { useEffect, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  adminDisputeService,
  disputeStatusLabel,
  type Dispute,
  type DisputeStatus,
} from '../../services/endpoints/complaintService';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Mở' },
  { value: 'AWAITING_INFO', label: 'Chờ bổ sung' },
  { value: 'JUDGED', label: 'Đã phán quyết' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền KH' },
  { value: 'RELEASED_TO_WORKSHOP', label: 'Đã chuyển xưởng' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

export const AdminDisputeManagementPage = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [ruling, setRuling] = useState('');
  const [violationNote, setViolationNote] = useState('');

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminDisputeService.list({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as DisputeStatus),
        page: 0,
        size: 50,
      });
      setDisputes(response.data.data?.content ?? []);
    } catch (loadError) {
      setDisputes([]);
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách tranh chấp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDisputes();
  }, [statusFilter]);

  const openDetail = async (dispute: Dispute) => {
    setSelected(dispute);
    setInfoMessage(dispute.adminRequestInfo ?? '');
    setRuling(dispute.ruling ?? '');
    setViolationNote(dispute.violationNote ?? '');
    try {
      const response = await adminDisputeService.get(dispute.id);
      const detail = response.data.data ?? dispute;
      setSelected(detail);
      setInfoMessage(detail.adminRequestInfo ?? '');
      setRuling(detail.ruling ?? '');
      setViolationNote(detail.violationNote ?? '');
    } catch {
      setSelected(dispute);
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await action();
      await loadDisputes();
      if (selected) {
        const refreshed = await adminDisputeService.get(selected.id);
        setSelected(refreshed.data.data ?? null);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Thao tác thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="font-headline-md text-slate-900 text-3xl">Quản lý tranh chấp</h1>
          <p className="text-slate-500 font-body-md mt-1">Xử lý tranh chấp: yêu cầu bổ sung, phán quyết, hoàn tiền, chuyển tiền xưởng và lưu vi phạm.</p>
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
          <button onClick={() => void loadDisputes()} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">
            Tải lại
          </button>
        </div>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">Danh sách tranh chấp</div>
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Đang tải…</p>
            ) : disputes.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Chưa có tranh chấp nào.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {disputes.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void openDetail(item)}
                      className={`w-full text-left px-6 py-4 hover:bg-slate-50 ${selected?.id === item.id ? 'bg-slate-50' : ''}`}
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">Tranh chấp #{item.id} · Đơn #{item.orderId}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.workshopName ?? `Xưởng #${item.workshopId}`}</p>
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.reason}</p>
                        </div>
                        <span className="text-xs font-bold uppercase text-red-700 bg-red-50 px-2 py-1 rounded-lg h-fit">
                          {disputeStatusLabel[item.status]}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-h-[800px] overflow-y-auto">
            <h2 className="font-bold text-slate-900 text-lg">Chi tiết tranh chấp</h2>
            {!selected ? (
              <p className="text-sm text-slate-500">Chọn một tranh chấp để xử lý.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Tranh chấp:</span> #{selected.id}</div>
                  <div><span className="text-slate-500">Khiếu nại:</span> #{selected.complaintId}</div>
                  <div><span className="text-slate-500">Đơn hàng:</span> #{selected.orderId}</div>
                  <div><span className="text-slate-500">Khách hàng:</span> {selected.customerName ?? `#${selected.customerId}`}</div>
                  <div><span className="text-slate-500">Xưởng:</span> {selected.workshopName ?? `#${selected.workshopId}`}</div>
                  <div><span className="text-slate-500">Trạng thái:</span> {disputeStatusLabel[selected.status]}</div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Lý do khiếu nại</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{selected.reason}</p>
                </div>

                {selected.imageUrls?.length ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Hình ảnh minh chứng</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.imageUrls.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="Minh chứng" className="h-24 w-24 rounded-lg object-cover border border-slate-200" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selected.ruling ? (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">Phán quyết</p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">{selected.ruling}</p>
                  </div>
                ) : null}

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">3.3 Yêu cầu bổ sung thông tin</p>
                  <textarea
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    rows={2}
                    placeholder="Nội dung yêu cầu khách hàng bổ sung..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                  />
                  <button
                    type="button"
                    disabled={saving || infoMessage.trim().length < 5}
                    onClick={() => void runAction(async () => {
                      await adminDisputeService.requestInfo(selected.id, infoMessage.trim());
                    })}
                    className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    Gửi yêu cầu bổ sung
                  </button>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">3.4 Đưa ra phán quyết</p>
                  <textarea
                    value={ruling}
                    onChange={(e) => setRuling(e.target.value)}
                    rows={3}
                    placeholder="Nội dung phán quyết của admin..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                  />
                  <button
                    type="button"
                    disabled={saving || ruling.trim().length < 10}
                    onClick={() => void runAction(async () => {
                      await adminDisputeService.submitRuling(selected.id, ruling.trim());
                    })}
                    className="px-4 py-2 bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    Lưu phán quyết
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={saving || selected.refundProcessed}
                    onClick={() => void runAction(async () => {
                      if (!window.confirm('Hoàn tiền toàn bộ đơn hàng cho khách hàng?')) return;
                      await adminDisputeService.refundCustomer(selected.id);
                    })}
                    className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {selected.refundProcessed ? 'Đã hoàn tiền KH' : '3.5 Hoàn tiền khách hàng'}
                  </button>
                  <button
                    type="button"
                    disabled={saving || selected.escrowReleased}
                    onClick={() => void runAction(async () => {
                      if (!window.confirm('Giải ngân escrow cho xưởng may?')) return;
                      await adminDisputeService.releaseWorkshop(selected.id);
                    })}
                    className="px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {selected.escrowReleased ? 'Đã chuyển xưởng' : '3.6 Chuyển tiền xưởng'}
                  </button>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">3.7 Lưu hồ sơ vi phạm</p>
                  <textarea
                    value={violationNote}
                    onChange={(e) => setViolationNote(e.target.value)}
                    rows={2}
                    placeholder="Mô tả vi phạm của xưởng..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
                  />
                  <button
                    type="button"
                    disabled={saving || violationNote.trim().length < 10}
                    onClick={() => void runAction(async () => {
                      await adminDisputeService.saveViolation(selected.id, violationNote.trim());
                    })}
                    className="px-4 py-2 bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {selected.violationRecorded ? 'Đã lưu vi phạm' : 'Lưu hồ sơ vi phạm'}
                  </button>
                </div>

                {selected.status !== 'CLOSED' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void runAction(async () => {
                      await adminDisputeService.close(selected.id);
                    })}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold"
                  >
                    Đóng tranh chấp
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
