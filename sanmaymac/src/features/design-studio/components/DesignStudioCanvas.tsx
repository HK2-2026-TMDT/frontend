import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas as FabricCanvas, Ellipse, FabricImage, Path, Rect } from 'fabric';

export type DesignSide = 'front' | 'back';

export type StickerPreset = {
  id: string;
  label: string;
  imageUrl: string;
};

type ShirtColorPreset = {
  id: string;
  label: string;
  color: string;
};

export type DesignStudioHandle = {
  addSticker: (presetId: string, point?: { x: number; y: number }) => void;
  addCustomSticker: (base64Data: string, name: string) => void;
  exportDesigns: () => Promise<{ frontDesign: File; backDesign: File }>;
  clearActiveCanvas: () => void;
  hasDesign: () => boolean;
};

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 900;

const PRINTABLE_BOUNDS = {
  left: 155,
  top: 200,
  width: 410,
  height: 530,
};

const PRINTABLE_CENTER = {
  x: PRINTABLE_BOUNDS.left + PRINTABLE_BOUNDS.width / 2,
  y: PRINTABLE_BOUNDS.top + PRINTABLE_BOUNDS.height / 2,
};

const toEmojiSticker = (emoji: string, background = '#f8fafc') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect x="10" y="10" width="220" height="220" rx="44" fill="${background}" stroke="rgba(15,23,42,0.08)" stroke-width="4"/>
      <text x="120" y="148" font-size="118" text-anchor="middle">${emoji}</text>
    </svg>`
  )}`;

const STICKER_PRESETS: StickerPreset[] = [
  { id: 'love', label: 'Trái tim', imageUrl: toEmojiSticker('❤️', '#ffe4e6') },
  { id: 'sparkle', label: 'Lấp lánh', imageUrl: toEmojiSticker('✨', '#fef3c7') },
  { id: 'star', label: 'Ngôi sao', imageUrl: toEmojiSticker('⭐', '#fef9c3') },
  { id: 'fire', label: 'Ngọn lửa', imageUrl: toEmojiSticker('🔥', '#ffedd5') },
  { id: 'lightning', label: 'Sấm sét', imageUrl: toEmojiSticker('⚡', '#fef08a') },
  { id: 'sun', label: 'Mặt trời', imageUrl: toEmojiSticker('☀️', '#fde68a') },
  { id: 'moon', label: 'Mặt trăng', imageUrl: toEmojiSticker('🌙', '#ddd6fe') },
  { id: 'cloud', label: 'Đám mây', imageUrl: toEmojiSticker('☁️', '#e2e8f0') },
  { id: 'rainbow', label: 'Cầu vồng', imageUrl: toEmojiSticker('🌈', '#ede9fe') },
  { id: 'flower', label: 'Hoa', imageUrl: toEmojiSticker('🌸', '#fce7f3') },
  { id: 'leaf', label: 'Lá cây', imageUrl: toEmojiSticker('🍃', '#dcfce7') },
  { id: 'clover', label: 'Cỏ 4 lá', imageUrl: toEmojiSticker('☘️', '#bbf7d0') },
  { id: 'crown', label: 'Vương miện', imageUrl: toEmojiSticker('👑', '#fef08a') },
  { id: 'gem', label: 'Kim cương', imageUrl: toEmojiSticker('💎', '#cffafe') },
  { id: 'gift', label: 'Quà tặng', imageUrl: toEmojiSticker('🎁', '#fee2e2') },
  { id: 'rocket', label: 'Tên lửa', imageUrl: toEmojiSticker('🚀', '#e0e7ff') },
  { id: 'trophy', label: 'Cúp', imageUrl: toEmojiSticker('🏆', '#fef3c7') },
  { id: 'medal', label: 'Huy chương', imageUrl: toEmojiSticker('🏅', '#fef3c7') },
  { id: 'cool', label: 'Mát mẻ', imageUrl: toEmojiSticker('😎', '#dbeafe') },
  { id: 'smile', label: 'Mỉm cười', imageUrl: toEmojiSticker('😊', '#fef9c3') },
  { id: 'wink', label: 'Nháy mắt', imageUrl: toEmojiSticker('😉', '#fef3c7') },
  { id: 'party', label: 'Party', imageUrl: toEmojiSticker('🥳', '#fde68a') },
  { id: 'music', label: 'Âm nhạc', imageUrl: toEmojiSticker('🎵', '#ede9fe') },
  { id: 'headphone', label: 'Tai nghe', imageUrl: toEmojiSticker('🎧', '#e2e8f0') },
  { id: 'camera', label: 'Camera', imageUrl: toEmojiSticker('📸', '#e0f2fe') },
  { id: 'game', label: 'Game', imageUrl: toEmojiSticker('🎮', '#ddd6fe') },
  { id: 'football', label: 'Bóng đá', imageUrl: toEmojiSticker('⚽', '#f1f5f9') },
  { id: 'basketball', label: 'Bóng rổ', imageUrl: toEmojiSticker('🏀', '#fed7aa') },
  { id: 'code', label: 'Code', imageUrl: toEmojiSticker('💻', '#e0e7ff') },
  { id: 'idea', label: 'Ý tưởng', imageUrl: toEmojiSticker('💡', '#fef08a') },
  { id: 'target', label: 'Mục tiêu', imageUrl: toEmojiSticker('🎯', '#fee2e2') },
  { id: 'check', label: 'Đã duyệt', imageUrl: toEmojiSticker('✅', '#dcfce7') },
];

const SHIRT_COLORS: ShirtColorPreset[] = [
  { id: 'white', label: 'Trắng', color: '#f8fafc' },
  { id: 'black', label: 'Đen', color: '#111827' },
  { id: 'red', label: 'Đỏ', color: '#b91c1c' },
  { id: 'blue', label: 'Xanh', color: '#1d4ed8' },
  { id: 'green', label: 'Xanh lá', color: '#15803d' },
];

const getStickerPreset = (presetId: string) => STICKER_PRESETS.find((preset) => preset.id === presetId) ?? STICKER_PRESETS[0];
const getShirtColor = (shirtColorId: string) => SHIRT_COLORS.find((color) => color.id === shirtColorId) ?? SHIRT_COLORS[0];

const dataUrlToFile = async (dataUrl: string, fileName: string) => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], fileName, { type: blob.type || 'image/png' });
};

const createPrintableClip = () =>
  new Rect({
    left: PRINTABLE_BOUNDS.left,
    top: PRINTABLE_BOUNDS.top,
    width: PRINTABLE_BOUNDS.width,
    height: PRINTABLE_BOUNDS.height,
    originX: 'left',
    originY: 'top',
    absolutePositioned: true,
  });

const initCanvasLayers = (canvas: FabricCanvas, shirtColorId: string) => {
  const existedLayers = canvas.getObjects().filter((object: any) => (object as any).data?.layerLocked);
  existedLayers.forEach((object) => canvas.remove(object));

  const shirtColor = getShirtColor(shirtColorId).color;

  const shirtBody = new Path(
    'M250 208 L176 260 L110 414 L190 454 L216 370 L216 728 Q216 758 246 758 H474 Q504 758 504 728 L504 370 L530 454 L610 414 L544 260 L470 208 Q430 182 360 182 Q290 182 250 208 Z',
    {
      fill: shirtColor,
      stroke: shirtColorId === 'white' ? '#64748b' : '#475569',
      strokeWidth: shirtColorId === 'white' ? 5 : 4,
      strokeLineJoin: 'round',
      strokeUniform: true,
      selectable: false,
      evented: false,
      excludeFromExport: false,
    }
  );
  (shirtBody as any).data = { layerLocked: true, layer: 'shirt-body' };

  const shirtCollar = new Path(
    'M292 194 Q360 158 428 194 L450 212 Q432 224 420 242 Q360 254 300 242 Q288 224 270 212 Z',
    {
      fill: '#e2e8f0',
      stroke: '#64748b',
      strokeWidth: 3,
      strokeLineJoin: 'round',
      strokeUniform: true,
      selectable: false,
      evented: false,
      excludeFromExport: false,
    }
  );
  (shirtCollar as any).data = { layerLocked: true, layer: 'shirt-collar' };

  const shirtShadow = new Ellipse({
    left: CANVAS_WIDTH / 2,
    top: 790,
    originX: 'center',
    originY: 'center',
    rx: 170,
    ry: 24,
    fill: '#0f172a',
    opacity: 0.12,
    selectable: false,
    evented: false,
    excludeFromExport: true,
  });
  (shirtShadow as any).data = { layerLocked: true, layer: 'shirt-shadow' };

  const printableGuideLayer = new Rect({
    left: PRINTABLE_BOUNDS.left,
    top: PRINTABLE_BOUNDS.top,
    width: PRINTABLE_BOUNDS.width,
    height: PRINTABLE_BOUNDS.height,
    originX: 'left',
    originY: 'top',
    rx: 16,
    ry: 16,
    fill: 'rgba(99,102,241,0.04)',
    stroke: 'rgba(99,102,241,0.65)',
    strokeWidth: 2,
    strokeDashArray: [10, 8],
    selectable: false,
    evented: false,
    excludeFromExport: true,
  });
  (printableGuideLayer as any).data = { layerLocked: true, layer: 'printable-guide' };

  canvas.add(shirtShadow);
  canvas.add(shirtBody);
  canvas.add(shirtCollar);
  canvas.add(printableGuideLayer);
  
  canvas.requestRenderAll();
};

const findPrintableGuide = (canvas: FabricCanvas) =>
  canvas.getObjects().find((obj: any) => obj.data?.layer === 'printable-guide') as Rect | undefined;

const setPrintableGuideHighlight = (canvas: FabricCanvas | null, active: boolean) => {
  if (!canvas) return;
  const guide = findPrintableGuide(canvas);
  if (!guide) return;
  guide.set({
    stroke: active ? '#6366f1' : 'rgba(99,102,241,0.65)',
    strokeWidth: active ? 3 : 2,
    fill: active ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.04)',
  });
  canvas.requestRenderAll();
};

const clampToPrintableBounds = (canvas: FabricCanvas, object: any) => {
  const width = object.getScaledWidth?.() ?? object.width ?? 0;
  const height = object.getScaledHeight?.() ?? object.height ?? 0;
  const right = PRINTABLE_BOUNDS.left + PRINTABLE_BOUNDS.width;
  const bottom = PRINTABLE_BOUNDS.top + PRINTABLE_BOUNDS.height;
  
  const nextLeft = Math.min(Math.max(object.left ?? 0, PRINTABLE_BOUNDS.left + width / 2), right - width / 2);
  const nextTop = Math.min(Math.max(object.top ?? 0, PRINTABLE_BOUNDS.top + height / 2), bottom - height / 2);

  object.set({ left: nextLeft, top: nextTop });
  object.setCoords();
  canvas.requestRenderAll();
};

const exportCanvasToFile = async (canvas: FabricCanvas, fileName: string) => {
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
  return dataUrlToFile(dataUrl, fileName);
};

export const DesignStudioCanvas = forwardRef<DesignStudioHandle>(function DesignStudioCanvas(_, ref) {
  const [activeSide, setActiveSide] = useState<DesignSide>('front');
  const [shirtColorId, setShirtColorId] = useState(SHIRT_COLORS[0].id);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  const frontCanvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const frontCanvasRef = useRef<FabricCanvas | null>(null);
  const backCanvasRef = useRef<FabricCanvas | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCanvasRef = useMemo(() => (activeSide === 'front' ? frontCanvasRef : backCanvasRef), [activeSide]);

  const showCanvasError = (message: string) => {
    setCanvasError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setCanvasError(null), 2200);
  };

  const wireCanvas = (canvas: FabricCanvas) => {
    canvas.on('object:moving', (event) => {
      const object = event.target as any;
      if (!object || object.data?.layerLocked) return;
      clampToPrintableBounds(canvas, object);
    });

    canvas.on('object:scaling', (event) => {
      const object = event.target as any;
      if (!object || object.data?.layerLocked) return;
      clampToPrintableBounds(canvas, object);
    });
  };

  useEffect(() => {
    if (!frontCanvasElementRef.current || !backCanvasElementRef.current) return;

    const frontCanvas = new FabricCanvas(frontCanvasElementRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f1f5f9', 
      preserveObjectStacking: true,
      selection: true,
      allowTouchScrolling: false,
    });

    const backCanvas = new FabricCanvas(backCanvasElementRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f1f5f9',
      preserveObjectStacking: true,
      selection: true,
      allowTouchScrolling: false,
    });

    wireCanvas(frontCanvas);
    wireCanvas(backCanvas);
    initCanvasLayers(frontCanvas, shirtColorId);
    initCanvasLayers(backCanvas, shirtColorId);

    frontCanvasRef.current = frontCanvas;
    backCanvasRef.current = backCanvas;
    setIsReady(true);

    return () => {
      frontCanvas.dispose();
      backCanvas.dispose();
      frontCanvasRef.current = null;
      backCanvasRef.current = null;
      setIsReady(false);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const newColor = getShirtColor(shirtColorId).color;

    [frontCanvasRef.current, backCanvasRef.current].forEach((canvas) => {
      if (!canvas) return;
      canvas.getObjects().forEach((obj: any) => {
        if (obj.data?.layer === 'shirt-body') {
          obj.set({
            fill: newColor,
            stroke: shirtColorId === 'white' ? '#64748b' : '#475569',
            strokeWidth: shirtColorId === 'white' ? 5 : 4,
          });
        }
      });
      canvas.requestRenderAll();
    });
  }, [shirtColorId, isReady]);

  useEffect(() => {
    if (!isReady) return;
    setPrintableGuideHighlight(frontCanvasRef.current, activeSide === 'front' && isDragOverCanvas);
    setPrintableGuideHighlight(backCanvasRef.current, activeSide === 'back' && isDragOverCanvas);
  }, [isDragOverCanvas, activeSide, isReady]);

  // Hàm thêm ảnh tổng quát (Hỗ trợ cả Preset hệ thống và ảnh tự tải Base64)
  const executeAddSticker = async (imageUrl: string, label: string, point?: { x: number; y: number }) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    try {
      const sticker = await FabricImage.fromURL(imageUrl);
      const maxWidth = 150;
      const sourceWidth = sticker.width || 1;
      const ratio = maxWidth / sourceWidth;
      
      sticker.set({
        left: point?.x ?? PRINTABLE_CENTER.x,
        top: point?.y ?? PRINTABLE_CENTER.y,
        originX: 'center',
        originY: 'center',
        scaleX: ratio,
        scaleY: ratio,
        borderColor: '#6366f1',
        cornerColor: '#6366f1',
        transparentCorners: false,
        clipPath: createPrintableClip(),
      });
      (sticker as any).data = { layerLocked: false, sticker: true, label };

      canvas.add(sticker);
      canvas.setActiveObject(sticker);
      clampToPrintableBounds(canvas, sticker);

      const guide = findPrintableGuide(canvas);
      if (guide) {
        (canvas as any).bringObjectToFront?.(guide) ?? (canvas as any).bringToFront?.(guide);
      }

      canvas.requestRenderAll();
    } catch {
      showCanvasError('Không thể render hình ảnh lên thân áo.');
    }
  };

  const addSticker = async (presetId: string, point?: { x: number; y: number }) => {
    const preset = getStickerPreset(presetId);
    await executeAddSticker(preset.imageUrl, preset.label, point);
  };

  // CHỨC NĂNG MỚI: Xử lý file ảnh người dùng tải lên từ PC/Điện thoại
  const handleLocalImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showCanvasError('Vui lòng chọn file ảnh hợp lệ (PNG, JPG, SVG)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (base64Data) {
        void executeAddSticker(base64Data, file.name.split('.')[0]);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input để upload liên tục
  };

  const handleCanvasDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes('application/json') || event.dataTransfer.types.includes('text/sticker-url')) {
      setIsDragOverCanvas(true);
    }
  };

  const handleCanvasDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOverCanvas(false);
    }
  };

  const addStickerFromDrop = (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragOverCanvas(false);
    event.preventDefault();
    const urlPayload = event.dataTransfer.getData('text/sticker-url');
    const jsonPayload = event.dataTransfer.getData('application/json');

    try {
      let presetId: string | undefined;
      let rawImageUrl: string | undefined;

      if (jsonPayload) {
        const parsed = JSON.parse(jsonPayload) as { presetId?: string; imageUrl?: string };
        presetId = parsed.presetId;
        rawImageUrl = parsed.imageUrl;
      }
      if (!presetId && urlPayload) {
        presetId = STICKER_PRESETS.find((preset) => preset.imageUrl === urlPayload)?.id;
        if (!presetId) rawImageUrl = urlPayload;
      }

      const canvas = activeCanvasRef.current;
      if (!canvas) return;

      const canvasElement = canvas.getElement();
      const rect = canvasElement.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const insidePrintable =
        x >= PRINTABLE_BOUNDS.left &&
        x <= PRINTABLE_BOUNDS.left + PRINTABLE_BOUNDS.width &&
        y >= PRINTABLE_BOUNDS.top &&
        y <= PRINTABLE_BOUNDS.top + PRINTABLE_BOUNDS.height;
        
      if (!insidePrintable) {
        showCanvasError('Hãy thả sticker vào vùng thiết kế trên thân áo.');
        return;
      }

      if (presetId) {
        void addSticker(presetId, { x, y });
      } else if (rawImageUrl) {
        void executeAddSticker(rawImageUrl, 'Custom Drop', { x, y });
      }
    } catch {
      showCanvasError('Dữ liệu kéo thả sticker không hợp lệ.');
    }
  };

  useEffect(() => {
    const handleDelete = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const canvas = activeCanvasRef.current;
      const object = canvas?.getActiveObject() as any;
      if (!canvas || !object || object.data?.layerLocked) return;

      event.preventDefault();
      canvas.remove(object);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    };

    document.addEventListener('keydown', handleDelete);
    return () => document.removeEventListener('keydown', handleDelete);
  }, [activeCanvasRef]);

  useImperativeHandle(
    ref,
    () => ({
      addSticker: (presetId, point) => {
        void addSticker(presetId, point);
      },
      addCustomSticker: (base64Data, name) => {
        void executeAddSticker(base64Data, name);
      },
      clearActiveCanvas: () => {
        const canvas = activeCanvasRef.current;
        if (!canvas) return;

        canvas
          .getObjects()
          .filter((object: any) => !(object as any).data?.layerLocked)
          .forEach((object) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      },
      hasDesign: () => {
        const frontHasStickers =
          frontCanvasRef.current?.getObjects().some((object: any) => !(object as any).data?.layerLocked) ?? false;
        const backHasStickers =
          backCanvasRef.current?.getObjects().some((object: any) => !(object as any).data?.layerLocked) ?? false;
        return frontHasStickers || backHasStickers;
      },
      exportDesigns: async () => {
        if (!frontCanvasRef.current || !backCanvasRef.current || !isReady) {
          throw new Error('Canvas thiết kế chưa sẵn sàng.');
        }

        const frontDesign = await exportCanvasToFile(frontCanvasRef.current, 'front_design.png');
        const backDesign = await exportCanvasToFile(backCanvasRef.current, 'back_design.png');
        return { frontDesign, backDesign };
      },
    }),
    [activeCanvasRef, isReady]
  );

  const renderCanvas = (side: DesignSide, refElement: RefObject<HTMLCanvasElement | null>) => {
    const hidden = activeSide !== side;

    return (
      <div
        className={`${hidden ? 'absolute inset-0 z-0 opacity-0 pointer-events-none invisible' : 'relative z-10 w-full'} transition-opacity duration-200`}
      >
        <div
          className="relative w-full"
          onDrop={addStickerFromDrop}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={handleCanvasDragEnter}
          onDragLeave={handleCanvasDragLeave}
        >
          <canvas
            ref={refElement}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block w-full h-auto rounded-2xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#eef2f7]">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Mặt áo</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeSide === 'front' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeSide === 'back' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sau
            </button>
          </div>
        </div>

        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Màu vải</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SHIRT_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                title={color.label}
                onClick={() => setShirtColorId(color.id)}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  shirtColorId === color.id
                    ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110'
                    : 'border-white shadow-sm hover:scale-105'
                }`}
                style={{ background: color.color }}
              />
            ))}
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleLocalImageUpload} accept="image/*" className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
        >
          <span className="material-symbols-outlined text-sm">upload</span>
          Tải ảnh
        </button>
      </div>

      {canvasError && (
        <div className="mx-4 mt-3 flex shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <span className="material-symbols-outlined text-base">error</span>
          {canvasError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Sticker</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">Kéo thả hoặc bấm để thêm vào áo</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-2">
              {STICKER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({ presetId: preset.id, imageUrl: preset.imageUrl })
                    );
                    event.dataTransfer.setData('text/sticker-url', preset.imageUrl);
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => void addSticker(preset.id)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-2 transition-all hover:border-indigo-400 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center">
                    <img
                      src={preset.imageUrl}
                      alt={preset.label}
                      draggable={false}
                      className="h-full w-full object-contain pointer-events-none"
                    />
                  </div>
                  <span className="w-full truncate text-center text-[10px] font-medium text-slate-600">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-indigo-500">touch_app</span>
              Kéo sticker vào vùng viền đứt trên áo
            </span>
            <span className="hidden md:inline">Del / Backspace để xóa đối tượng đang chọn</span>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-3">
            <div className="relative w-full max-w-[520px]">
              {renderCanvas('front', frontCanvasElementRef)}
              {renderCanvas('back', backCanvasElementRef)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});