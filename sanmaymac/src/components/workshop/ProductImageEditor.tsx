import { useRef, useState } from 'react';
import {
  catalogService,
  resolveCatalogAssetUrl,
  type ProductImage,
  type ProductPayloadImage,
} from '../../services/endpoints/catalogService';

interface ProductImageEditorProps {
  productId?: number;
  images: ProductImage[];
  pendingFiles?: File[];
  onImagesChange: (images: ProductImage[]) => void;
  onPendingFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}

const toPayloadImages = (images: ProductImage[]): ProductPayloadImage[] =>
  images.map((image, index) => ({
    imageUrl: image.imageUrl,
    isThumbnail: image.isThumbnail,
    sortOrder: image.sortOrder ?? index,
  }));

export const ProductImageEditor = ({
  productId,
  images,
  pendingFiles = [],
  onImagesChange,
  onPendingFilesChange,
  disabled,
  onError,
}: ProductImageEditorProps) => {
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const persistImages = async (nextImages: ProductImage[]) => {
    onImagesChange(nextImages);
    if (!productId) return;
    setSaving(true);
    try {
      await catalogService.replaceProductImages(productId, toPayloadImages(nextImages));
    } catch {
      onError?.('Không thể cập nhật danh sách ảnh.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!productId) {
      onPendingFilesChange?.([...pendingFiles, file]);
      return;
    }
    setSaving(true);
    try {
      const res = await catalogService.uploadProductImage(
        productId,
        file,
        images.length === 0,
      );
      onImagesChange(res.data.data?.images ?? []);
    } catch {
      onError?.('Không thể tải ảnh lên.');
    } finally {
      setSaving(false);
    }
  };

  const setThumbnail = async (image: ProductImage) => {
    const next = images.map((item) => ({
      ...item,
      isThumbnail: item.id === image.id,
    }));
    await persistImages(next);
  };

  const removeImage = async (image: ProductImage) => {
    if (!window.confirm('Xóa ảnh này?')) return;
    const remaining = images.filter((item) => item.id !== image.id);
    const normalized = remaining.map((item, index) => ({
      ...item,
      sortOrder: index,
      isThumbnail: item.isThumbnail && item.id !== image.id,
    }));
    if (normalized.length && !normalized.some((item) => item.isThumbnail)) {
      normalized[0] = { ...normalized[0], isThumbnail: true };
    }
    await persistImages(normalized);
  };

  const removePending = (index: number) => {
    onPendingFilesChange?.(pendingFiles.filter((_, i) => i !== index));
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    await persistImages(
      next.map((item, sortIndex) => ({
        ...item,
        sortOrder: sortIndex,
      })),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || saving}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">upload</span>
          Thêm ảnh
        </button>
        <p className="text-xs text-on-surface-variant">JPG, PNG, WEBP. Ảnh đầu tiên hoặc ảnh bìa dùng làm thumbnail.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={!productId}
          className="hidden"
          disabled={disabled || saving}
          onChange={(e) => {
            const files = e.target.files;
            if (!files?.length) return;
            if (productId) {
              void handleUpload(files[0]);
            } else {
              onPendingFilesChange?.([...pendingFiles, ...Array.from(files)]);
            }
            e.currentTarget.value = '';
          }}
        />
      </div>

      {productId && images.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container"
            >
              <div className="relative aspect-square">
                <img
                  src={resolveCatalogAssetUrl(image.imageUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {image.isThumbnail ? (
                  <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-white">
                    Ảnh bìa
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                <button
                  type="button"
                  disabled={disabled || saving || index === 0}
                  onClick={() => void moveImage(index, -1)}
                  className="rounded-lg border border-outline-variant px-2 py-1 text-[11px] disabled:opacity-50"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={disabled || saving || index === images.length - 1}
                  onClick={() => void moveImage(index, 1)}
                  className="rounded-lg border border-outline-variant px-2 py-1 text-[11px] disabled:opacity-50"
                >
                  →
                </button>
                {!image.isThumbnail ? (
                  <button
                    type="button"
                    disabled={disabled || saving}
                    onClick={() => void setThumbnail(image)}
                    className="flex-1 rounded-lg border border-outline-variant px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
                  >
                    Đặt bìa
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={disabled || saving}
                  onClick={() => void removeImage(image)}
                  className="rounded-lg border border-error/30 px-2 py-1 text-[11px] font-semibold text-error disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!productId && pendingFiles.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pendingFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative overflow-hidden rounded-xl border border-outline-variant"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="aspect-square w-full object-cover"
              />
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-white">
                  Ảnh bìa
                </span>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removePending(index)}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {!productId && !pendingFiles.length && !images.length ? (
        <div className="rounded-xl border border-dashed border-outline-variant px-4 py-10 text-center">
          <span className="material-symbols-outlined text-4xl text-outline">image</span>
          <p className="mt-3 text-sm text-on-surface-variant">Thêm ảnh để khách hàng xem chi tiết sản phẩm.</p>
        </div>
      ) : null}
    </div>
  );
};
