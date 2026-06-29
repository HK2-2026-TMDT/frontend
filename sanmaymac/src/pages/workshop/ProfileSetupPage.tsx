import { useEffect, useState } from 'react';
import { WorkshopLayout } from '../../layouts/WorkshopLayout';
import { workshopService, type WorkshopKyc, type WorkshopProfile } from '../../services/endpoints/workshopService';

const emptyProfile: WorkshopProfile = {
  shopName: '',
  workshopAddress: '',
  productionCapacity: 0,
  description: '',
  bankName: '',
  bankAccountNo: '',
  bankAccountName: '',
};

const emptyKyc: WorkshopKyc = {
  licenseUrl: '',
  taxCode: '',
  note: '',
};

export const ProfileSetupPage = () => {
  const [profile, setProfile] = useState<WorkshopProfile>(emptyProfile);
  const [kyc, setKyc] = useState<WorkshopKyc>(emptyKyc);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const [profileResponse, kycResponse] = await Promise.allSettled([
          workshopService.getWorkshopProfile(),
          workshopService.getWorkshopKyc(),
        ]);

        if (!mounted) return;

        if (profileResponse.status === 'fulfilled') {
          const data = profileResponse.value.data.data ?? emptyProfile;
          setProfile({
            ...emptyProfile,
            ...data,
            workshopAddress: data.workshopAddress ?? data.address ?? '',
            bankAccountName: data.bankAccountName ?? '',
            bankAccountNo: data.bankAccountNo ?? '',
            bankName: data.bankName ?? '',
          });
        }

        if (kycResponse.status === 'fulfilled') {
          setKyc({
            ...emptyKyc,
            ...kycResponse.value.data.data,
          });
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ xưởng.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await workshopService.updateWorkshopProfile({
        ...profile,
        workshopAddress: profile.workshopAddress ?? profile.address,
        address: profile.workshopAddress ?? profile.address,
      });
      const data = response.data.data ?? profile;
      setProfile({
        ...emptyProfile,
        ...data,
        workshopAddress: data.workshopAddress ?? data.address ?? '',
      });
      setSuccessMessage('Đã cập nhật hồ sơ xưởng.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu hồ sơ xưởng.');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveKyc = async () => {
    if (!kyc.taxCode || !kyc.licenseUrl) {
      setError('Vui lòng nhập đủ mã số thuế và link giấy phép.');
      return;
    }

    setSavingKyc(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await workshopService.updateWorkshopKyc({
        taxCode: kyc.taxCode,
        licenseUrl: kyc.licenseUrl,
        note: kyc.note,
      });
      setKyc({ ...emptyKyc, ...response.data.data });
      setSuccessMessage('Đã cập nhật KYC.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu KYC.');
    } finally {
      setSavingKyc(false);
    }
  };

  const handleFileUpload = async (kind: 'avatar' | 'logo' | 'license', file?: File) => {
    if (!file) return;

    setError(null);
    setSuccessMessage(null);

    try {
      if (kind === 'avatar') {
        setUploadingAvatar(true);
        const response = await workshopService.uploadWorkshopAvatar(file);
        setProfile((current) => ({
          ...current,
          ...(response.data.data ?? {}),
        }));
        setSuccessMessage('Đã tải ảnh đại diện xưởng.');
      }

      if (kind === 'logo') {
        setUploadingLogo(true);
        const response = await workshopService.uploadWorkshopLogo(file);
        setProfile((current) => ({
          ...current,
          ...(response.data.data ?? {}),
        }));
        setSuccessMessage('Đã tải logo xưởng.');
      }

      if (kind === 'license') {
        setUploadingLicense(true);
        const response = await workshopService.uploadWorkshopKycFile(file);
        setKyc((current) => ({
          ...current,
          ...(response.data.data ?? {}),
        }));
        setSuccessMessage('Đã tải giấy phép/KYC.');
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể tải file lên.');
    } finally {
      setUploadingAvatar(false);
      setUploadingLogo(false);
      setUploadingLicense(false);
    }
  };

  return (
    <WorkshopLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="font-headline-md text-on-surface text-3xl">Thiết lập hồ sơ xưởng</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Dữ liệu được lấy và cập nhật trực tiếp qua API /workshop/profile, /workshop/kyc và các endpoint upload.</p>
        </header>

        {error && <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}
        {successMessage && <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
          <div className="space-y-6">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-on-surface text-lg">Thông tin xưởng</h2>
                  <p className="text-sm text-on-surface-variant">Hồ sơ hiển thị trên toàn bộ giao diện role Xưởng.</p>
                </div>
                {loading && <span className="text-xs font-bold text-secondary uppercase tracking-widest">Đang tải...</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-start">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-4 text-center space-y-3">
                    <div className="w-24 h-24 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center text-4xl font-black mx-auto overflow-hidden border-4 border-white shadow-sm">
                      {(profile.shopName || 'XX').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {profile.avatarUrl ? 'Đã có ảnh đại diện' : 'Chưa có ảnh đại diện'}
                    </div>
                  </div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    Tải ảnh đại diện
                    <input type="file" accept="image/*" onChange={(event) => void handleFileUpload('avatar', event.target.files?.[0])} className="mt-2 block w-full text-xs" />
                  </label>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    Tải logo
                    <input type="file" accept="image/*" onChange={(event) => void handleFileUpload('logo', event.target.files?.[0])} className="mt-2 block w-full text-xs" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tên xưởng</label>
                    <input value={profile.shopName ?? ''} onChange={(event) => setProfile((current) => ({ ...current, shopName: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Địa chỉ xưởng</label>
                    <input value={profile.workshopAddress ?? profile.address ?? ''} onChange={(event) => setProfile((current) => ({ ...current, workshopAddress: event.target.value, address: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Năng lực sản xuất</label>
                    <input type="number" value={profile.productionCapacity ?? 0} onChange={(event) => setProfile((current) => ({ ...current, productionCapacity: Number(event.target.value) }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Người liên hệ</label>
                    <input value={profile.fullName ?? ''} onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Email liên hệ</label>
                    <input type="email" value={profile.email ?? ''} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Số điện thoại</label>
                    <input type="tel" value={profile.phone ?? ''} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Mô tả xưởng</label>
                    <textarea value={profile.description ?? ''} onChange={(event) => setProfile((current) => ({ ...current, description: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary h-28 resize-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setProfile(emptyProfile)} className="px-6 py-2.5 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container transition-all">
                  Làm mới
                </button>
                <button type="button" onClick={() => void saveProfile()} disabled={savingProfile || loading} className="px-8 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="font-bold text-on-surface text-lg">KYC và giấy phép</h2>
                <p className="text-sm text-on-surface-variant">Dùng để gửi hồ sơ xác minh cho admin.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Mã số thuế</label>
                  <input value={kyc.taxCode ?? ''} onChange={(event) => setKyc((current) => ({ ...current, taxCode: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Link giấy phép</label>
                  <input value={kyc.licenseUrl ?? ''} onChange={(event) => setKyc((current) => ({ ...current, licenseUrl: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary" />
                </div>
              </div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Tải file giấy phép
                <input type="file" accept="image/*,.pdf" onChange={(event) => void handleFileUpload('license', event.target.files?.[0])} className="mt-2 block w-full text-xs" />
              </label>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ghi chú</label>
                <textarea value={kyc.note ?? ''} onChange={(event) => setKyc((current) => ({ ...current, note: event.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-secondary h-28 resize-none" />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => void saveKyc()} disabled={savingKyc || loading} className="px-8 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {savingKyc ? 'Đang gửi...' : 'Lưu KYC'}
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-6 sticky top-6">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-on-surface text-lg">Thông tin nhanh</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-on-surface-variant">Trạng thái KYC</span>
                  <span className="font-bold text-on-surface">{kyc.status ?? 'Chưa rõ'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-on-surface-variant">Năng lực</span>
                  <span className="font-bold text-on-surface">{profile.productionCapacity ?? 0}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-on-surface-variant">Logo</span>
                  <span className="font-bold text-on-surface">{profile.logoUrl ? 'Đã có' : 'Chưa có'}</span>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-on-surface text-lg">Lưu ý</h3>
              <p className="text-sm text-on-surface-variant">Trang này dùng đúng các endpoint profile, KYC và upload đã có trong API workshop.</p>
            </section>
          </aside>
        </div>
      </div>
    </WorkshopLayout>
  );
};
