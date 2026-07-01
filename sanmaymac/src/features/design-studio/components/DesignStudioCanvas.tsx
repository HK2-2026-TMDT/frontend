import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas as FabricCanvas, Ellipse, FabricImage, Path, Rect } from 'fabric';
import { AiDesignPromptPanel } from './AiDesignPromptPanel';
import { planAutoDesign } from '../lib/aiDesignPlanner';
import { CANVAS_HEIGHT, CANVAS_WIDTH, PRINTABLE_BOUNDS, PRINTABLE_CENTER } from '../lib/printableBounds';
import {
  getShirtColor,
  getStickerPreset,
  SHIRT_COLORS,
  STICKER_PRESETS,
  type StickerPreset,
} from '../types/stickerPresets';

export type DesignSide = 'front' | 'back';
export { STICKER_PRESETS };
export type { StickerPreset };

export type DesignStudioCanvasProps = {
  onBack?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  pageError?: string | null;
  onDismissError?: () => void;
};

type ToolTab = 'ai' | 'stickers';

export type DesignStudioHandle = {
  addSticker: (presetId: string, point?: { x: number; y: number }) => void;
  addCustomSticker: (base64Data: string, name: string) => void;
  applyAutoDesign: (prompt: string) => Promise<{ rationale: string }>;
  exportDesigns: () => Promise<{ frontDesign: File; backDesign: File }>;
  clearActiveCanvas: () => void;
  hasDesign: () => boolean;
};

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

const clearCanvasStickers = (canvas: FabricCanvas | null) => {
  if (!canvas) return;
  canvas
    .getObjects()
    .filter((object: any) => !(object as any).data?.layerLocked)
    .forEach((object) => canvas.remove(object));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
};

const exportCanvasToFile = async (canvas: FabricCanvas, fileName: string) => {
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
  return dataUrlToFile(dataUrl, fileName);
};

export const DesignStudioCanvas = forwardRef<DesignStudioHandle, DesignStudioCanvasProps>(function DesignStudioCanvas(
  { onBack, onSave, isSaving = false, pageError, onDismissError },
  ref
) {
  const [activeSide, setActiveSide] = useState<DesignSide>('front');
  const [shirtColorId, setShirtColorId] = useState(SHIRT_COLORS[0].id);
  const [toolTab, setToolTab] = useState<ToolTab>('ai');
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

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

  const executeAddStickerToCanvas = async (
    canvas: FabricCanvas,
    imageUrl: string,
    label: string,
    point?: { x: number; y: number },
    scaleMultiplier = 1,
    rotation = 0
  ) => {
    try {
      const sticker = await FabricImage.fromURL(imageUrl);
      const maxWidth = 150 * scaleMultiplier;
      const sourceWidth = sticker.width || 1;
      const ratio = maxWidth / sourceWidth;

      sticker.set({
        left: point?.x ?? PRINTABLE_CENTER.x,
        top: point?.y ?? PRINTABLE_CENTER.y,
        originX: 'center',
        originY: 'center',
        scaleX: ratio,
        scaleY: ratio,
        angle: rotation,
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

  const executeAddSticker = async (
    imageUrl: string,
    label: string,
    point?: { x: number; y: number },
    scaleMultiplier = 1,
    rotation = 0
  ) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    await executeAddStickerToCanvas(canvas, imageUrl, label, point, scaleMultiplier, rotation);
  };

  const addSticker = async (
    presetId: string,
    point?: { x: number; y: number },
    scaleMultiplier = 1,
    rotation = 0
  ) => {
    const preset = getStickerPreset(presetId);
    await executeAddSticker(preset.imageUrl, preset.label, point, scaleMultiplier, rotation);
  };

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
    event.target.value = '';
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

  const applyAutoDesign = async (prompt: string) => {
    if (!isReady) {
      throw new Error('Canvas thiết kế chưa sẵn sàng.');
    }

    const plan = planAutoDesign(prompt);
    const targetCanvas = plan.side === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!targetCanvas) {
      throw new Error('Canvas thiết kế chưa sẵn sàng.');
    }

    setActiveSide(plan.side);
    setShirtColorId(plan.shirtColorId);
    clearCanvasStickers(targetCanvas);

    for (const item of plan.stickers) {
      const preset = getStickerPreset(item.presetId);
      await executeAddStickerToCanvas(
        targetCanvas,
        preset.imageUrl,
        preset.label,
        { x: item.x, y: item.y },
        item.scale,
        item.rotation ?? 0
      );
    }

    setAiRationale(plan.rationale);
    setToolTab('stickers');
    return { rationale: plan.rationale };
  };

  const handleGenerateAiDesign = async (prompt: string) => {
    setIsGeneratingAi(true);
    setAiRationale(null);
    try {
      await applyAutoDesign(prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo thiết kế AI lúc này.';
      showCanvasError(message);
    } finally {
      setIsGeneratingAi(false);
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
      applyAutoDesign: async (prompt) => applyAutoDesign(prompt),
      clearActiveCanvas: () => {
        clearCanvasStickers(activeCanvasRef.current);
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
            className="block w-full h-auto rounded-xl"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:invisible"
          aria-label="Quay lại"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">Thiết kế áo</h1>
        </div>

        {/* Toolbar gọn trên desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeSide === 'front' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Mặt trước
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeSide === 'back' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Mặt sau
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5">
            {SHIRT_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                title={color.label}
                onClick={() => setShirtColorId(color.id)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  shirtColorId === color.id ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110' : 'border-white shadow-sm'
                }`}
                style={{ background: color.color }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => activeCanvasRef.current && clearCanvasStickers(activeCanvasRef.current)}
            className="hidden rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
          >
            Xóa mặt này
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">{isSaving ? 'hourglass_empty' : 'save'}</span>
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </header>

      {(pageError || canvasError) && (
        <div className="mx-4 mt-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {pageError ?? canvasError}
          </span>
          {pageError && onDismissError && (
            <button type="button" onClick={onDismissError} className="text-red-400 hover:text-red-600">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
      )}

      {/* ── Mobile toolbar ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 md:hidden">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setActiveSide('front')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${activeSide === 'front' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            Trước
          </button>
          <button
            type="button"
            onClick={() => setActiveSide('back')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${activeSide === 'back' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            Sau
          </button>
        </div>
        <div className="flex items-center gap-1">
          {SHIRT_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              title={color.label}
              onClick={() => setShirtColorId(color.id)}
              className={`h-6 w-6 rounded-full border-2 ${shirtColorId === color.id ? 'border-indigo-600 ring-1 ring-indigo-300' : 'border-white'}`}
              style={{ background: color.color }}
            />
          ))}
        </div>
      </div>

      {/* ── Main workspace ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Tools panel */}
        <aside className="flex w-[min(100%,300px)] shrink-0 flex-col border-r border-slate-200 bg-white sm:w-[300px] lg:w-[320px]">
          <div className="grid grid-cols-2 gap-1 border-b border-slate-100 p-2">
            <button
              type="button"
              onClick={() => setToolTab('ai')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                toolTab === 'ai' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              AI
            </button>
            <button
              type="button"
              onClick={() => setToolTab('stickers')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                toolTab === 'stickers' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-base">emoji_emotions</span>
              Sticker
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {toolTab === 'ai' ? (
              <AiDesignPromptPanel
                isGenerating={isGeneratingAi}
                lastRationale={aiRationale}
                onGenerate={handleGenerateAiDesign}
              />
            ) : (
              <div className="flex h-full flex-col p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">Bấm hoặc kéo thả vào áo</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Tải ảnh
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
                      className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-2 transition hover:border-indigo-300 hover:bg-white hover:shadow-sm"
                      title={preset.label}
                    >
                      <img src={preset.imageUrl} alt={preset.label} draggable={false} className="h-9 w-9 object-contain" />
                      <span className="w-full truncate text-center text-[9px] font-medium text-slate-500">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas zone */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-6 lg:p-8"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.35) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          >
            <div className="relative w-full max-w-[min(100%,560px)] lg:max-w-[620px] xl:max-w-[680px]">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                  <span className="material-symbols-outlined text-sm text-indigo-500">touch_app</span>
                  Kéo sticker vào vùng viền đứt
                </span>
                <span className="hidden rounded-full bg-white/90 px-3 py-1 text-[11px] text-slate-500 shadow-sm ring-1 ring-slate-200/80 sm:inline-block">
                  Del / Backspace để xóa
                </span>
              </div>

              <div className="rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200/80 sm:p-3">
                {renderCanvas('front', frontCanvasElementRef)}
                {renderCanvas('back', backCanvasElementRef)}
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-400 sm:hidden">
            Chọn tab AI hoặc Sticker bên trái để bắt đầu
          </footer>
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleLocalImageUpload} accept="image/*" className="hidden" />
    </div>
  );
});
