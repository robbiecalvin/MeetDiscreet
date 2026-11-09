// Exact draft-format parsing only. No currency or live billing policy is selected.
export function parseDraftAmount(value) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, decimals = ''] = value.split('.');
  const minor = BigInt(whole) * 100n + BigInt(decimals.padEnd(2, '0'));
  return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}
