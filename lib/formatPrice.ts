/**
 * Formats a numeric string as a MXN currency display string.
 * Returns '—' for falsy values (empty string, '0', etc.)
 */
export function formatPrice(val: string): string {
  const n = parseInt(val);
  if (!n) return '—';
  return `$${n.toLocaleString('es-MX')} MXN`;
}
