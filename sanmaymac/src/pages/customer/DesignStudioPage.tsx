import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { DesignStudioCanvas, type DesignStudioHandle } from '../../features/design-studio/components/DesignStudioCanvas';
import { biddingService } from '../../services/endpoints/biddingService';

export const DesignStudioPage = () => {
  const navigate = useNavigate();
  const designRef = useRef<DesignStudioHandle>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveDesign = async () => {
    if (!designRef.current?.hasDesign()) {
      setError('Hãy thêm ít nhất một sticker trước khi lưu thiết kế.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { frontDesign, backDesign } = await designRef.current.exportDesigns();
      const saveRes = await biddingService.saveDesign(frontDesign, backDesign);
      const saved = saveRes.data.data;

      navigate('/create-tender', {
        replace: true,
        state: { selectedDesignId: saved.id, designSaved: true },
      });
    } catch {
      setError('Không thể lưu thiết kế lúc này. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomerLayout hideQuickAction hideFooter fullHeightMain>
      <DesignStudioCanvas
        ref={designRef}
        onBack={() => navigate('/create-tender')}
        onSave={() => void handleSaveDesign()}
        isSaving={isSaving}
        pageError={error}
        onDismissError={() => setError(null)}
      />
    </CustomerLayout>
  );
};
