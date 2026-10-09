// Helpers for building PostgREST filters from user input safely.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/**
 * Builds an `or` filter that matches `term` (case-insensitive substring) in any
 * of the given columns. The value is double-quoted so commas, parentheses and
 * dots in user input cannot alter the filter, and LIKE wildcards are escaped.
 */
export function ilikeAny(columns: string[], term: string): string {
  const escaped = term
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[%_]/g, m => `\\${m}`)
  return columns.map(col => `${col}.ilike."%${escaped}%"`).join(',')
}

/** Normalises a user-entered URL to http(s), or returns null if it is unusable. */
export function normalizeUrl(input: string, { httpsOnly = false } = {}): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (httpsOnly ? url.protocol !== 'https:' : !['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}
