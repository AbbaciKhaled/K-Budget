/** Colors offered for categories and tags — all readable as text on white (AA). */
export const COLORS = [
  "#3245ff",
  "#6e4bf2",
  "#d6338a",
  "#de3f45",
  "#d4560b",
  "#b7791f",
  "#07875a",
  "#0f8a8a",
  "#0a74da",
  "#646b78",
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
