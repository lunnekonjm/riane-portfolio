export function renderCategoryIcon(iconType: string | undefined, defaultEmoji: string = '💳'): string {
  if (!iconType) return defaultEmoji;
  if (iconType === 'home') return '🏠';
  if (iconType === 'video') return '📱';
  if (iconType === 'people') return '👥';
  if (iconType === 'heart') return '❤️';
  if (iconType === 'chart') return '📈';
  if (iconType === 'shield') return '🛡️';
  if (iconType === 'card') return '💳';
  return iconType;
}
