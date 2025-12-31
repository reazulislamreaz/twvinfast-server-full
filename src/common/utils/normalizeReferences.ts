export function normalizeReferences(ref: any): string | null {
  if (!ref) return null;
  return Array.isArray(ref) ? ref.join(' ') : ref;
}
