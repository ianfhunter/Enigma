const BASE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#84cc16', '#10b981', '#06b6d4', '#a855f7', '#fb7185',
];

const PATTERNS = ['solid', 'stripe', 'dot', 'cross', 'diag'];

export function getBallAppearance(colorId) {
  return {
    color: BASE_COLORS[colorId % BASE_COLORS.length],
    pattern: PATTERNS[colorId % PATTERNS.length],
  };
}
