import { useEffect, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  adminCouponService,
  type AdminCoupon,
  type AdminCouponPayload,
} from '../../services/endpoints/adminCouponService';

const defaultForm: AdminCouponPayload = {
  code: '',
  discountType: 'PERCENT',
  discountValue: 0,
  isActive: true,
};

export const AdminCouponManagementPage = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminCouponPayload>(defaultForm);
  const [error, setError] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCouponService.listCoupons();
      setCoupons(res.data.data ?? []);
    } catch {
      setError('Không thể tải danh sách mã giảm giá.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await adminCouponService.updateCoupon(editingId, form);
      } else {
        await adminCouponService.createCoupon(form);
      }
      setForm(defaultForm);
      setEditingId(null);
      await loadCoupons();
    } catch {
      setError('Không thể lưu mã giảm giá.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon: AdminCoupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      usageLimit: coupon.usageLimit,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
    });
  };

  const handleDelete = async (couponId: number) => {
    setSaving(true);
    setError(null);
    try {
      await adminCouponService.deleteCoupon(couponId);
      await loadCoupons();
    } catch {
      setError('Không thể xoá mã giảm giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="font-headline-md text-slate-900 text-3xl">Quản lý mã giảm giá</h1>
          <p className="text-slate-500 font-body-md mt-1">Tạo, chỉnh sửa và vô hiệu hóa coupon cho toàn hệ thống.</p>
        </header>

        {error && <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="Mã coupon"
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          />
          <select
            value={form.discountType}
            onChange={(event) => setForm((prev) => ({ ...prev, discountType: event.target.value as 'PERCENT' | 'FIXED' }))}
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          >
            <option value="PERCENT">Phần trăm (%)</option>
            <option value="FIXED">Số tiền cố định</option>
          </select>
          <input
            type="number"
            value={form.discountValue}
            onChange={(event) => setForm((prev) => ({ ...prev, discountValue: Number(event.target.value) }))}
            placeholder="Giá trị giảm"
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          />
          <input
            type="number"
            value={form.minOrderAmount ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, minOrderAmount: event.target.value ? Number(event.target.value) : undefined }))}
            placeholder="Đơn tối thiểu"
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          />
          <input
            type="number"
            value={form.maxDiscountAmount ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value ? Number(event.target.value) : undefined }))}
            placeholder="Giảm tối đa"
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          />
          <input
            type="number"
            value={form.usageLimit ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value ? Number(event.target.value) : undefined }))}
            placeholder="Giới hạn lượt dùng"
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          />
          <input
            type="datetime-local"
            value={form.startsAt ? form.startsAt.slice(0, 16) : ''}
            onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value ? new Date(event.target.value).toISOString() : undefined }))}
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          />
          <input
            type="datetime-local"
            value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
            onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value ? new Date(event.target.value).toISOString() : undefined }))}
            className="px-4 py-3 border border-outline-variant rounded-xl text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Đang hoạt động
          </label>
          <div className="md:col-span-3 flex gap-3">
            <button
              onClick={() => void submit()}
              disabled={saving || !form.code}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {editingId ? 'Cập nhật coupon' : 'Tạo coupon'}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setForm(defaultForm);
                }}
                className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium"
              >
                Hủy sửa
              </button>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Đang tải coupon...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Mã</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Giá trị</th>
                  <th className="px-4 py-3 text-left">Đã dùng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-semibold">{coupon.code}</td>
                    <td className="px-4 py-3">{coupon.discountType}</td>
                    <td className="px-4 py-3">{coupon.discountValue}</td>
                    <td className="px-4 py-3">{coupon.usedCount}/{coupon.usageLimit ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                        {coupon.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit(coupon)} className="px-3 py-1 border border-outline-variant rounded text-xs">Sửa</button>
                      <button onClick={() => void handleDelete(coupon.id)} className="px-3 py-1 border border-error text-error rounded text-xs">Xoá</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};
