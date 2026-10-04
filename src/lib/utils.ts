export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Reduce any redirect target (absolute or relative) to a local path, so we never redirect off-site. */
export function safeRedirectPath(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value) return fallback;
  try {
    const url = new URL(value, "http://local.invalid");
    const path = url.pathname + url.search;
    return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
  } catch {
    return fallback;
  }
}
