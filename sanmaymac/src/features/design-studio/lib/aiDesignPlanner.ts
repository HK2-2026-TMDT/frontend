import { getShirtColor, SHIRT_COLORS, STICKER_PRESETS, type StickerPreset } from '../types/stickerPresets';
import { PRINTABLE_CENTER } from './printableBounds';

export type PlannedSticker = {
  presetId: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
};

export type AutoDesignPlan = {
  side: 'front' | 'back';
  shirtColorId: string;
  stickers: PlannedSticker[];
  rationale: string;
};

const COLOR_RULES: Array<{ id: string; keywords: string[] }> = [
  { id: 'black', keywords: ['đen', 'black', 'dark', 'tối', 'ngầu'] },
  { id: 'white', keywords: ['trắng', 'white', 'sáng', 'clean', 'tối giản'] },
  { id: 'red', keywords: ['đỏ', 'red', 'nóng bỏng', 'passion'] },
  { id: 'green', keywords: ['xanh lá', 'green', 'eco', 'thiên nhiên', 'nature'] },
  { id: 'blue', keywords: ['xanh', 'blue', 'biển', 'ocean', 'tech'] },
];

const PROMPT_EXAMPLES = [
  'Áo team dev ngầu màu đen, icon code và tên lửa',
  'Sự kiện vui nhộn màu trắng, party và cầu vồng',
  'CLB bóng đá năng động, màu xanh, cúp và bóng',
  'Merch âm nhạc tối giản, tai nghe và nốt nhạc',
];

export const AI_DESIGN_PROMPT_EXAMPLES = PROMPT_EXAMPLES;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const hashPrompt = (prompt: string) => {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pickStickerCount = (prompt: string) => {
  const normalized = normalize(prompt);
  if (/toi gian|minimal|don gian|simple|tinh te/.test(normalized)) return 1;
  if (/nhieu|ruc ro|vui nhon|colorful|party lon|day du/.test(normalized)) return 5;
  if (/can bang|balanced|team|dong phuc|club/.test(normalized)) return 4;
  return 3;
};

const pickShirtColorId = (prompt: string) => {
  const normalized = normalize(prompt);
  for (const rule of COLOR_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(normalize(keyword)))) {
      return rule.id;
    }
  }
  return SHIRT_COLORS[hashPrompt(prompt) % SHIRT_COLORS.length].id;
};

const pickSide = (prompt: string): 'front' | 'back' => {
  const normalized = normalize(prompt);
  return /mat sau|in sau|back side|design back|sau ao/.test(normalized) ? 'back' : 'front';
};

const scoreStickers = (prompt: string, presets: StickerPreset[]) => {
  const normalized = normalize(prompt);
  const scores = new Map<string, number>();

  for (const preset of presets) {
    let score = 0;
    if (normalized.includes(normalize(preset.label))) {
      score += 6;
    }
    if (normalized.includes(preset.id)) {
      score += 5;
    }
    for (const tag of preset.tags) {
      const normalizedTag = normalize(tag);
      if (normalized.includes(normalizedTag)) {
        score += normalizedTag.length >= 6 ? 4 : 3;
      }
    }
    if (score > 0) {
      scores.set(preset.id, score);
    }
  }

  return scores;
};

const pickFallbackStickers = (prompt: string, count: number, presets: StickerPreset[]) => {
  const start = hashPrompt(prompt) % presets.length;
  const picked: string[] = [];
  for (let i = 0; i < presets.length && picked.length < count; i += 1) {
    const preset = presets[(start + i) % presets.length];
    if (!picked.includes(preset.id)) {
      picked.push(preset.id);
    }
  }
  return picked;
};

const layoutStickers = (presetIds: string[]): PlannedSticker[] => {
  const cx = PRINTABLE_CENTER.x;
  const cy = PRINTABLE_CENTER.y;

  if (presetIds.length === 1) {
    return [{ presetId: presetIds[0], x: cx, y: cy, scale: 1.45 }];
  }

  if (presetIds.length === 2) {
    return [
      { presetId: presetIds[0], x: cx - 78, y: cy, scale: 1.15, rotation: -8 },
      { presetId: presetIds[1], x: cx + 78, y: cy, scale: 1.15, rotation: 8 },
    ];
  }

  const [hero, ...accents] = presetIds;
  const layout: PlannedSticker[] = [
    { presetId: hero, x: cx, y: cy - 36, scale: 1.35 },
  ];

  const accentSlots: Array<Omit<PlannedSticker, 'presetId'>> = [
    { x: cx - 128, y: cy + 108, scale: 0.88, rotation: -12 },
    { x: cx + 128, y: cy + 108, scale: 0.88, rotation: 12 },
    { x: cx - 148, y: cy - 96, scale: 0.78, rotation: -6 },
    { x: cx + 148, y: cy - 96, scale: 0.78, rotation: 6 },
    { x: cx, y: cy + 148, scale: 0.72 },
  ];

  accents.forEach((presetId, index) => {
    const slot = accentSlots[index];
    if (!slot) return;
    layout.push({ presetId, ...slot });
  });

  return layout;
};

export const planAutoDesign = (prompt: string, presets: StickerPreset[] = STICKER_PRESETS): AutoDesignPlan => {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Vui lòng nhập mô tả thiết kế.');
  }

  const count = pickStickerCount(trimmed);
  const scores = scoreStickers(trimmed, presets);
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);

  let selectedIds = ranked.slice(0, count).map(([id]) => id);
  if (selectedIds.length === 0) {
    selectedIds = pickFallbackStickers(trimmed, count, presets);
  } else if (selectedIds.length < count) {
    const extras = pickFallbackStickers(trimmed, count, presets).filter((id) => !selectedIds.includes(id));
    selectedIds = [...selectedIds, ...extras].slice(0, count);
  }

  const shirtColorId = pickShirtColorId(trimmed);
  const side = pickSide(trimmed);
  const stickers = layoutStickers(selectedIds);
  const labels = selectedIds
    .map((id) => presets.find((preset) => preset.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  return {
    side,
    shirtColorId,
    stickers,
    rationale: `AI chọn ${labels} trên áo ${getShirtColor(shirtColorId).label.toLowerCase()} — bố cục cân đối theo mô tả "${trimmed}".`,
  };
};
