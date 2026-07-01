export type StickerPreset = {
  id: string;
  label: string;
  imageUrl: string;
  tags: string[];
};

export type ShirtColorPreset = {
  id: string;
  label: string;
  color: string;
};

const toEmojiSticker = (emoji: string, background = '#f8fafc') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect x="10" y="10" width="220" height="220" rx="44" fill="${background}" stroke="rgba(15,23,42,0.08)" stroke-width="4"/>
      <text x="120" y="148" font-size="118" text-anchor="middle">${emoji}</text>
    </svg>`
  )}`;

export const STICKER_PRESETS: StickerPreset[] = [
  { id: 'love', label: 'Trái tim', imageUrl: toEmojiSticker('❤️', '#ffe4e6'), tags: ['love', 'tim', 'trái tim', 'yêu', 'heart'] },
  { id: 'sparkle', label: 'Lấp lánh', imageUrl: toEmojiSticker('✨', '#fef3c7'), tags: ['sparkle', 'lấp lánh', 'sáng', 'shine'] },
  { id: 'star', label: 'Ngôi sao', imageUrl: toEmojiSticker('⭐', '#fef9c3'), tags: ['star', 'sao', 'ngôi sao'] },
  { id: 'fire', label: 'Ngọn lửa', imageUrl: toEmojiSticker('🔥', '#ffedd5'), tags: ['fire', 'lửa', 'hot', 'nóng'] },
  { id: 'lightning', label: 'Sấm sét', imageUrl: toEmojiSticker('⚡', '#fef08a'), tags: ['lightning', 'sét', 'sấm', 'energy'] },
  { id: 'sun', label: 'Mặt trời', imageUrl: toEmojiSticker('☀️', '#fde68a'), tags: ['sun', 'mặt trời', 'nắng', 'summer'] },
  { id: 'moon', label: 'Mặt trăng', imageUrl: toEmojiSticker('🌙', '#ddd6fe'), tags: ['moon', 'trăng', 'đêm', 'night'] },
  { id: 'cloud', label: 'Đám mây', imageUrl: toEmojiSticker('☁️', '#e2e8f0'), tags: ['cloud', 'mây', 'sky'] },
  { id: 'rainbow', label: 'Cầu vồng', imageUrl: toEmojiSticker('🌈', '#ede9fe'), tags: ['rainbow', 'cầu vồng', 'colorful', 'rực rỡ'] },
  { id: 'flower', label: 'Hoa', imageUrl: toEmojiSticker('🌸', '#fce7f3'), tags: ['flower', 'hoa', 'nữ', 'cute'] },
  { id: 'leaf', label: 'Lá cây', imageUrl: toEmojiSticker('🍃', '#dcfce7'), tags: ['leaf', 'lá', 'nature', 'xanh', 'eco'] },
  { id: 'clover', label: 'Cỏ 4 lá', imageUrl: toEmojiSticker('☘️', '#bbf7d0'), tags: ['clover', 'may mắn', 'lucky'] },
  { id: 'crown', label: 'Vương miện', imageUrl: toEmojiSticker('👑', '#fef08a'), tags: ['crown', 'vương miện', 'vua', 'premium', 'vip'] },
  { id: 'gem', label: 'Kim cương', imageUrl: toEmojiSticker('💎', '#cffafe'), tags: ['gem', 'kim cương', 'luxury', 'sang'] },
  { id: 'gift', label: 'Quà tặng', imageUrl: toEmojiSticker('🎁', '#fee2e2'), tags: ['gift', 'quà', 'sinh nhật', 'birthday'] },
  { id: 'rocket', label: 'Tên lửa', imageUrl: toEmojiSticker('🚀', '#e0e7ff'), tags: ['rocket', 'tên lửa', 'startup', 'bay', 'launch'] },
  { id: 'trophy', label: 'Cúp', imageUrl: toEmojiSticker('🏆', '#fef3c7'), tags: ['trophy', 'cúp', 'win', 'chiến thắng', 'champion'] },
  { id: 'medal', label: 'Huy chương', imageUrl: toEmojiSticker('🏅', '#fef3c7'), tags: ['medal', 'huy chương', 'sport', 'thể thao'] },
  { id: 'cool', label: 'Mát mẻ', imageUrl: toEmojiSticker('😎', '#dbeafe'), tags: ['cool', 'ngầu', 'dev', 'team'] },
  { id: 'smile', label: 'Mỉm cười', imageUrl: toEmojiSticker('😊', '#fef9c3'), tags: ['smile', 'cười', 'vui', 'happy'] },
  { id: 'wink', label: 'Nháy mắt', imageUrl: toEmojiSticker('😉', '#fef3c7'), tags: ['wink', 'nháy', 'fun'] },
  { id: 'party', label: 'Party', imageUrl: toEmojiSticker('🥳', '#fde68a'), tags: ['party', 'sự kiện', 'event', 'vui nhộn', 'celebration'] },
  { id: 'music', label: 'Âm nhạc', imageUrl: toEmojiSticker('🎵', '#ede9fe'), tags: ['music', 'nhạc', 'âm nhạc', 'band'] },
  { id: 'headphone', label: 'Tai nghe', imageUrl: toEmojiSticker('🎧', '#e2e8f0'), tags: ['headphone', 'tai nghe', 'audio'] },
  { id: 'camera', label: 'Camera', imageUrl: toEmojiSticker('📸', '#e0f2fe'), tags: ['camera', 'chụp ảnh', 'photo'] },
  { id: 'game', label: 'Game', imageUrl: toEmojiSticker('🎮', '#ddd6fe'), tags: ['game', 'gamer', 'chơi', 'esport'] },
  { id: 'football', label: 'Bóng đá', imageUrl: toEmojiSticker('⚽', '#f1f5f9'), tags: ['football', 'bóng đá', 'soccer', 'sport'] },
  { id: 'basketball', label: 'Bóng rổ', imageUrl: toEmojiSticker('🏀', '#fed7aa'), tags: ['basketball', 'bóng rổ', 'sport'] },
  { id: 'code', label: 'Code', imageUrl: toEmojiSticker('💻', '#e0e7ff'), tags: ['code', 'lập trình', 'dev', 'developer', 'tech', 'it'] },
  { id: 'idea', label: 'Ý tưởng', imageUrl: toEmojiSticker('💡', '#fef08a'), tags: ['idea', 'ý tưởng', 'sáng tạo', 'creative'] },
  { id: 'target', label: 'Mục tiêu', imageUrl: toEmojiSticker('🎯', '#fee2e2'), tags: ['target', 'mục tiêu', 'goal', 'focus'] },
  { id: 'check', label: 'Đã duyệt', imageUrl: toEmojiSticker('✅', '#dcfce7'), tags: ['check', 'duyệt', 'ok', 'done'] },
];

export const SHIRT_COLORS: ShirtColorPreset[] = [
  { id: 'white', label: 'Trắng', color: '#f8fafc' },
  { id: 'black', label: 'Đen', color: '#111827' },
  { id: 'red', label: 'Đỏ', color: '#b91c1c' },
  { id: 'blue', label: 'Xanh', color: '#1d4ed8' },
  { id: 'green', label: 'Xanh lá', color: '#15803d' },
];

export const getStickerPreset = (presetId: string) =>
  STICKER_PRESETS.find((preset) => preset.id === presetId) ?? STICKER_PRESETS[0];

export const getShirtColor = (shirtColorId: string) =>
  SHIRT_COLORS.find((color) => color.id === shirtColorId) ?? SHIRT_COLORS[0];
