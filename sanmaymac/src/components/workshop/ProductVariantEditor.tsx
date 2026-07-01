import { useState } from 'react';
import {
  catalogService,
  type ProductPayloadVariant,
  type ProductVariant,
} from '../../services/endpoints/catalogService';

export type VariantDraft = {
  key: string;
  id?: number;
  skuCode: string;
  color: string;
  size: string;
  price: string;
  stockQuantity: number;
};

const emptyRow = (): VariantDraft => ({
  key: crypto.randomUUID(),
  skuCode: '',
  color: '',
  size: '',
  price: '',
  stockQuantity: 0,
});

const toDraft = (variant: ProductVariant): VariantDraft => ({
  key: `existing-${variant.id}`,
  id: variant.id,
  skuCode: variant.skuCode ?? '',
  color: variant.color ?? '',
  size: variant.size ?? '',
  price: variant.price != null ? String(variant.price) : '',
  stockQuantity: variant.stockQuantity ?? 0,
});

const toPayload = (row: VariantDraft, basePrice: number): ProductPayloadVariant => ({
  skuCode: row.skuCode.trim() || undefined,
  color: row.color.trim() || undefined,
  size: row.size.trim() || undefined,
  price: row.price.trim() ? Number(row.price) : basePrice,
  stockQuantity: row.stockQuantity,
});

interface ProductVariantEditorProps {
  mode: 'create' | 'edit';
  productId?: number;
  basePrice: number;
  rows: VariantDraft[];
  onChange: (rows: VariantDraft[]) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export const ProductVariantEditor = ({
  mode,
  productId,
  basePrice,
  rows,
  onChange,
  disabled,
  onError,
}: ProductVariantEditorProps) => {
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const updateRow = (key: string, patch: Partial<VariantDraft>) => {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onChange([...rows, emptyRow()]);
  };

  const removeRow = async (row: VariantDraft) => {
    if (mode === 'edit' && row.id && productId) {
      if (!window.confirm('Xóa biến thể này?')) return;
      setSavingKey(row.key);
      try {
        await catalogService.deleteVariant(row.id);
        onChange(rows.filter((item) => item.key !== row.key));
      } catch {
        onError?.('Không thể xóa biến thể.');
      } finally {
        setSavingKey(null);
      }
      return;
    }
    onChange(rows.filter((item) => item.key !== row.key));
  };

  const persistRow = async (row: VariantDraft) => {
    if (mode !== 'edit' || !productId) return;
    setSavingKey(row.key);
    try {
      const payload = toPayload(row, basePrice);
      if (row.id) {
        const res = await catalogService.updateVariant(row.id, payload);
        updateRow(row.key, toDraft(res.data.data!));
      } else {
        const res = await catalogService.addVariant(productId, payload);
        updateRow(row.key, toDraft(res.data.data!));
      }
    } catch {
      onError?.('Không thể lưu biến thể.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-on-surface">Biến thể sản phẩm</p>
          <p className="text-xs text-on-surface-variant">
            Mỗi dòng là một tổ hợp màu, size, SKU, giá và tồn kho. Giá để trống sẽ dùng giá cơ bản.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-xl border border-secondary/30 px-3 py-2 text-xs font-semibold text-secondary hover:bg-secondary/5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Thêm dòng
        </button>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-outline-variant">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Màu</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Giá (VND)</th>
                <th className="px-3 py-2">Tồn kho</th>
                <th className="px-3 py-2 w-28" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-outline-variant">
                  <td className="px-2 py-2">
                    <input
                      value={row.color}
                      disabled={disabled || savingKey === row.key}
                      onChange={(e) => updateRow(row.key, { color: e.target.value })}
                      placeholder="Đen"
                      className="w-full min-w-[80px] rounded-lg border border-outline-variant px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.size}
                      disabled={disabled || savingKey === row.key}
                      onChange={(e) => updateRow(row.key, { size: e.target.value })}
                      placeholder="M"
                      className="w-full min-w-[70px] rounded-lg border border-outline-variant px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.skuCode}
                      disabled={disabled || savingKey === row.key}
                      onChange={(e) => updateRow(row.key, { skuCode: e.target.value })}
                      placeholder="AT-001-M"
                      className="w-full min-w-[100px] rounded-lg border border-outline-variant px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      value={row.price}
                      disabled={disabled || savingKey === row.key}
                      onChange={(e) => updateRow(row.key, { price: e.target.value })}
                      placeholder={String(basePrice || '')}
                      className="w-full min-w-[100px] rounded-lg border border-outline-variant px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      value={row.stockQuantity}
                      disabled={disabled || savingKey === row.key}
                      onChange={(e) =>
                        updateRow(row.key, { stockQuantity: Number(e.target.value) || 0 })
                      }
                      className="w-full min-w-[70px] rounded-lg border border-outline-variant px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      {mode === 'edit' ? (
                        <button
                          type="button"
                          disabled={disabled || savingKey === row.key}
                          onClick={() => void persistRow(row)}
                          className="rounded-lg bg-secondary px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                        >
                          Lưu
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={disabled || savingKey === row.key || rows.length <= 1}
                        onClick={() => void removeRow(row)}
                        className="rounded-lg border border-error/30 px-2 py-1 text-[11px] font-semibold text-error disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-on-surface-variant">
          Chưa có biến thể. Thêm ít nhất một dòng để khách chọn màu/size.
        </div>
      )}
    </div>
  );
};

export const variantsToDrafts = (variants?: ProductVariant[]): VariantDraft[] =>
  variants?.length ? variants.map(toDraft) : [emptyRow()];

export const draftsToPayload = (rows: VariantDraft[], basePrice: number): ProductPayloadVariant[] =>
  rows.map((row) => toPayload(row, basePrice));
