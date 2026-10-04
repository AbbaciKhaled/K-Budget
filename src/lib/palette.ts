/**
 * Colors offered for categories and tags. Order is the validated categorical order
 * (adjacent pairs pass CVD ΔE ≥ 8 and normal-vision ΔE ≥ 15 on white), so tags created
 * in sequence get colors that stay distinguishable in charts. Used for marks, never text.
 */
export const COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
] as const;

export const CATEGORY_EMOJIS = [
  "💰", "🏠", "👶", "🛒", "🍔", "🚗", "✈️", "🎁",
  "💼", "🛍️", "🐶", "🎓", "💊", "🎮", "📱", "⚡",
  "🏋️", "🎉", "☕", "👕", "🏦", "📦", "🧾", "🌱",
] as const;

export const CATEGORY_SUGGESTIONS = [
  { name: "Household", icon: "🏠" },
  { name: "My son", icon: "👶" },
  { name: "Vinted", icon: "🛍️" },
  { name: "Groceries", icon: "🛒" },
  { name: "Side hustle", icon: "💼" },
] as const;

export function pickColor(index: number) {
  return COLORS[index % COLORS.length];
}
