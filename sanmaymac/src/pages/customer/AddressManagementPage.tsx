import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { addressService, UserAddress } from '../../services/endpoints/addressService';
import { AddressFormModal } from '../../components/address/AddressFormModal';

export const AddressManagementPage = () => {
  const { isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserAddress | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressService.list();
      setAddresses(res.data.data ?? []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadAddresses();
  }, [isAuthenticated, loadAddresses]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    setDeletingId(id);
    try {
      await addressService.remove(id);
      await loadAddresses();
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-on-surface-variant mb-4">Vui lòng đăng nhập để quản lý địa chỉ.</p>
          <Link to="/auth/login" className="btn-user-primary-md">Đăng nhập</Link>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <main className="max-w-[900px] mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline-lg text-on-surface">Quản lý địa chỉ</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Thêm và chỉnh sửa địa chỉ giao hàng của bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-user-primary-md"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm địa chỉ
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-surface-container rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="border border-dashed border-outline-variant rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-3 block">location_off</span>
            <p className="text-on-surface-variant mb-4">Bạn chưa có địa chỉ giao hàng.</p>
            <button
              type="button"
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="btn-user-outline-md"
            >
              Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <article
                key={addr.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-on-surface">{addr.receiverName}</p>
                    <span className="text-on-surface-variant">·</span>
                    <p className="text-sm text-on-surface-variant">{addr.phone}</p>
                    {addr.isDefault && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant mt-2">
                    {addr.fullAddress || addr.detailedAddress}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditing(addr); setModalOpen(true); }}
                    className="btn-user-outline-sm"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="btn-user-outline-sm text-error border-error/30 hover:bg-error/8"
                  >
                    {deletingId === addr.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <AddressFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={async () => {
          await loadAddresses();
        }}
      />
    </CustomerLayout>
  );
};
