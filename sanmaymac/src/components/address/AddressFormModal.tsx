import { useEffect, useState } from 'react';
import {
  addressService,
  AddressPayload,
  UserAddress,
} from '../../services/endpoints/addressService';
import {
  District,
  locationService,
  Province,
  Ward,
} from '../../services/endpoints/locationService';

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (address: UserAddress) => void;
  editing?: UserAddress | null;
}

const emptyForm: AddressPayload = {
  receiverName: '',
  phone: '',
  detailedAddress: '',
  provinceId: 0,
  districtId: 0,
  wardCode: '',
  provinceName: '',
  districtName: '',
  wardName: '',
  isDefault: false,
};

export const AddressFormModal = ({
  open,
  onClose,
  onSaved,
  editing,
}: AddressFormModalProps) => {
  const [form, setForm] = useState<AddressPayload>(emptyForm);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setForm({
        receiverName: editing.receiverName,
        phone: editing.phone,
        detailedAddress: editing.detailedAddress,
        provinceId: editing.provinceId ?? 0,
        districtId: editing.districtId ?? 0,
        wardCode: editing.wardCode ?? '',
        provinceName: editing.provinceName ?? '',
        districtName: editing.districtName ?? '',
        wardName: editing.wardName ?? '',
        isDefault: editing.isDefault,
      });
    } else {
      setForm(emptyForm);
      setDistricts([]);
      setWards([]);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    setLoadingLocations(true);
    locationService
      .getProvinces()
      .then((res) => {
        const list = res.data.data ?? [];
        setProvinces(list);
        const msg = res.data.message;
        if (list.length === 0 && msg && msg !== 'OK') {
          setError(msg);
        }
      })
      .catch(() => setError('Không tải được danh sách tỉnh/thành.'))
      .finally(() => setLoadingLocations(false));
  }, [open]);

  useEffect(() => {
    if (!open || !form.provinceId) {
      setDistricts([]);
      return;
    }
    locationService
      .getDistricts(form.provinceId)
      .then((res) => setDistricts(res.data.data ?? []))
      .catch(() => setDistricts([]));
  }, [open, form.provinceId]);

  useEffect(() => {
    if (!open || !form.districtId) {
      setWards([]);
      return;
    }
    locationService
      .getWards(form.districtId)
      .then((res) => setWards(res.data.data ?? []))
      .catch(() => setWards([]));
  }, [open, form.districtId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.receiverName.trim() || !form.phone.trim() || !form.detailedAddress.trim()) {
      setError('Vui lòng điền đầy đủ thông tin người nhận.');
      return;
    }
    if (!form.provinceId || !form.districtId || !form.wardCode) {
      setError('Vui lòng chọn tỉnh/thành, quận/huyện và phường/xã.');
      return;
    }
    setSaving(true);
    try {
      const res = editing
        ? await addressService.update(editing.id, form)
        : await addressService.create(form);
      onSaved(res.data.data!);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không thể lưu địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div className="relative w-full max-w-lg bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="font-bold text-lg text-on-surface">
            {editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Họ tên người nhận
            </label>
            <input
              value={form.receiverName}
              onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
              className="mt-1 w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Số điện thoại
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
              placeholder="09xxxxxxxx"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Tỉnh/Thành
              </label>
              <select
                value={form.provinceId || ''}
                disabled={loadingLocations}
                onChange={(e) => {
                  const provinceId = Number(e.target.value);
                  const province = provinces.find((p) => p.provinceId === provinceId);
                  setForm({
                    ...form,
                    provinceId,
                    provinceName: province?.provinceName ?? '',
                    districtId: 0,
                    districtName: '',
                    wardCode: '',
                    wardName: '',
                  });
                }}
                className="mt-1 w-full px-3 py-3 border border-outline-variant rounded-xl text-sm bg-surface"
              >
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map((p) => (
                  <option key={p.provinceId} value={p.provinceId}>
                    {p.provinceName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Quận/Huyện
              </label>
              <select
                value={form.districtId || ''}
                disabled={!form.provinceId}
                onChange={(e) => {
                  const districtId = Number(e.target.value);
                  const district = districts.find((d) => d.districtId === districtId);
                  setForm({
                    ...form,
                    districtId,
                    districtName: district?.districtName ?? '',
                    wardCode: '',
                    wardName: '',
                  });
                }}
                className="mt-1 w-full px-3 py-3 border border-outline-variant rounded-xl text-sm bg-surface"
              >
                <option value="">Chọn quận/huyện</option>
                {districts.map((d) => (
                  <option key={d.districtId} value={d.districtId}>
                    {d.districtName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Phường/Xã
              </label>
              <select
                value={form.wardCode || ''}
                disabled={!form.districtId}
                onChange={(e) => {
                  const wardCode = e.target.value;
                  const ward = wards.find((w) => w.wardCode === wardCode);
                  setForm({
                    ...form,
                    wardCode,
                    wardName: ward?.wardName ?? '',
                  });
                }}
                className="mt-1 w-full px-3 py-3 border border-outline-variant rounded-xl text-sm bg-surface"
              >
                <option value="">Chọn phường/xã</option>
                {wards.map((w) => (
                  <option key={w.wardCode} value={w.wardCode}>
                    {w.wardName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Địa chỉ chi tiết
            </label>
            <input
              value={form.detailedAddress}
              onChange={(e) => setForm({ ...form, detailedAddress: e.target.value })}
              className="mt-1 w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none bg-surface"
              placeholder="Số nhà, tên đường..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="accent-secondary"
            />
            Đặt làm địa chỉ mặc định
          </label>

          {error && (
            <p className="text-sm text-error bg-error/8 border border-error/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-user-outline-md flex-1">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="btn-user-primary-md flex-1">
              {saving ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
