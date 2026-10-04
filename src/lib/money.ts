export const CURRENCIES = [
  { code: "EUR", label: "Euro", locale: "en-IE" },
  { code: "USD", label: "US Dollar", locale: "en-US" },
  { code: "GBP", label: "British Pound", locale: "en-GB" },
  { code: "CHF", label: "Swiss Franc", locale: "en-CH" },
  { code: "CAD", label: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", label: "Australian Dollar", locale: "en-AU" },
  { code: "SEK", label: "Swedish Krona", locale: "en-SE" },
  { code: "NOK", label: "Norwegian Krone", locale: "en-NO" },
  { code: "DKK", label: "Danish Krone", locale: "en-DK" },
  { code: "PLN", label: "Polish Złoty", locale: "en-PL" },
  { code: "MAD", label: "Moroccan Dirham", locale: "en-MA" },
  { code: "DZD", label: "Algerian Dinar", locale: "en-DZ" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]];

export function localeFor(currency: string) {
  return CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US";
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, compact: boolean, signDisplay: Intl.NumberFormatOptions["signDisplay"]) {
  const key = `${currency}|${compact}|${signDisplay}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(localeFor(currency), {
      style: "currency",
      currency,
      signDisplay,
      ...(compact ? { notation: "compact", maximumFractionDigits: 1 } : {}),
    });
    formatters.set(key, f);
  }
  return f;
}

/** Format an amount stored in cents. */
export function formatMoney(
  cents: number,
  currency: string,
  opts: { compact?: boolean; sign?: Intl.NumberFormatOptions["signDisplay"] } = {},
) {
  return formatter(currency, opts.compact ?? false, opts.sign ?? "auto").format(cents / 100);
}

/** Split a formatted amount so the decimals can be styled separately. */
export function formatMoneyParts(cents: number, currency: string, sign: Intl.NumberFormatOptions["signDisplay"] = "auto") {
  const parts = formatter(currency, false, sign).formatToParts(cents / 100);
  let main = "";
  let fraction = "";
  let seenDecimal = false;
  for (const p of parts) {
    if (p.type === "decimal") seenDecimal = true;
    if (seenDecimal && (p.type === "decimal" || p.type === "fraction")) fraction += p.value;
    else main += p.value;
  }
  return { main: main.trim(), fraction };
}

export function currencySymbol(currency: string) {
  return (
    formatter(currency, false, "auto")
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

/** Parse user input like "12", "12.5", "12,50", "1 234,56" into cents. Returns null if invalid. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[\s ']/g, "").replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}
