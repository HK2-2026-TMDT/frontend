import { useEffect, useState } from 'react';
import { WorkshopPageHeader } from '../../components/workshop/WorkshopPageHeader';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type WorkshopKyc, type WorkshopProfile } from '../../services/endpoints/workshopService';

export const WorkshopProfileSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [profile, setProfile] = useState<WorkshopProfile>({ shopName: '', description: '', productionCapacity: 0 });
  const [kyc, setKyc] = useState<WorkshopKyc>({ licenseUrl: '', taxCode: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const [profileResponse, kycResponse] = await Promise.allSettled([
          workshopService.getWorkshopProfile(),
          workshopService.getWorkshopKyc(),
        ]);

        if (!mounted) return;

        if (profileResponse.status === 'fulfilled') {
          setProfile(profileResponse.value.data.data ?? { shopName: '', description: '', productionCapacity: 0 });
        }
        if (kycResponse.status === 'fulfilled') {
          setKyc(kycResponse.value.data.data ?? { licenseUrl: '', taxCode: '', note: '' });
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ xưởng.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await workshopService.updateWorkshopProfile(profile);
      setProfile(response.data.data ?? profile);
      setSuccessMessage('Đã cập nhật thông tin chung.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu thông tin chung.');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveKyc = async () => {
    if (!kyc.licenseUrl || !kyc.taxCode) {
      setError('Vui lòng nhập đầy đủ licenseUrl và taxCode.');
      return;
    }

    setSavingKyc(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await workshopService.updateWorkshopKyc({
        licenseUrl: kyc.licenseUrl,
        taxCode: kyc.taxCode,
        note: kyc.note,
      });
      setKyc(response.data.data ?? kyc);
      setSuccessMessage('Đã gửi cập nhật KYC.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu KYC.');
    } finally {
      setSavingKyc(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <WorkshopPageHeader
          title="Thiết lập xưởng"
          description="Cập nhật thông tin xưởng, hồ sơ năng lực và KYC."
        />

        {error && <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}
        {successMessage && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <div className="flex gap-8 border-b border-outline-variant">
          {[
            { id: 'general', label: 'Thông tin chung' },
            { id: 'capacity', label: 'Hồ sơ năng lực' },
            { id: 'security', label: 'Bảo mật' },
            { id: 'notifications', label: 'Thông báo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={'pb-4 font-label-sm border-b-2 transition-all ' +
                (activeTab === tab.id ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-on-surface')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 space-y-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center text-4xl font-extrabold overflow-hidden border-4 border-white shadow-md">
                  {(profile.shopName ?? 'XX').slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">photo_camera</span>
                </div>
              </div>
              <div className="flex-1 space-y-6">
                {loading ? (
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant">Đang tải hồ sơ xưởng...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tên xưởng may</label>
                      <input type="text" value={profile.shopName ?? ''} onChange={(event) => setProfile((current) => ({ ...current, shopName: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Lĩnh vực chuyên môn</label>
                      <input type="text" value={profile.description ?? ''} onChange={(event) => setProfile((current) => ({ ...current, description: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Email liên hệ</label>
                      <input type="email" value={profile.email ?? ''} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số điện thoại</label>
                      <input type="tel" value={profile.phone ?? ''} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Địa chỉ trụ sở</label>
                  <textarea value={profile.address ?? ''} onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none h-24 resize-none" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant flex justify-end gap-3">
              <button type="button" className="px-6 py-2.5 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container transition-all">Hủy bỏ</button>
              <button type="button" onClick={() => void saveProfile()} disabled={savingProfile || loading} className="px-8 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 space-y-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Mã số thuế</label>
                <input type="text" value={kyc.taxCode ?? ''} onChange={(event) => setKyc((current) => ({ ...current, taxCode: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Link giấy phép</label>
                <input type="text" value={kyc.licenseUrl ?? ''} onChange={(event) => setKyc((current) => ({ ...current, licenseUrl: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ghi chú KYC</label>
              <textarea value={kyc.note ?? ''} onChange={(event) => setKyc((current) => ({ ...current, note: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary outline-none h-32 resize-none" />
            </div>
            <div className="pt-2 flex justify-end">
              <button type="button" onClick={() => void saveKyc()} disabled={savingKyc || loading} className="px-8 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50">
                {savingKyc ? 'Đang gửi...' : 'Lưu KYC'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm space-y-4">
            <h3 className="font-bold text-on-surface text-lg">Bảo mật tài khoản</h3>
            <p className="text-sm text-on-surface-variant">Tab này chưa có endpoint riêng trong tài liệu hiện tại. Có thể mở rộng sau với đổi mật khẩu / OAuth / 2FA.</p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm space-y-4">
            <h3 className="font-bold text-on-surface text-lg">Thông báo</h3>
            <p className="text-sm text-on-surface-variant">Chưa có endpoint thông báo cho role xưởng trong API tài liệu. Trang này đang giữ UI sẵn sàng để nối API sau.</p>
          </div>
        )}
      </div>
    </WorkshopLayout>
  );
};
