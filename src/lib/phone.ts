// Shared phone normalization for Colombian numbers (57 + 10 digits).
// Used by /api/ai/client and /api/ai/book to match phones regardless of prefix format.

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local  = digits.startsWith("57") && digits.length === 12 ? digits.slice(2) : digits;
  const col    = local.length === 10 ? `57${local}` : digits;
  return { digits, local, col };
}

// Returns a Supabase or() filter string covering all format variants of a phone.
export function phoneOrFilter(raw: string): string {
  const { digits, local, col } = normalizePhone(raw);
  return [...new Set([raw, digits, local, col])]
    .filter(Boolean)
    .map(v => `phone.eq.${v}`)
    .join(",");
}
