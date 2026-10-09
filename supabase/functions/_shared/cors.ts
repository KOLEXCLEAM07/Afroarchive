// Shared CORS handling for Edge Functions.
// ALLOWED_ORIGINS is a comma-separated list; when unset, any origin is allowed.

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean)

export function corsHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }

  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*'
    return headers
  }

  const origin = req.headers.get('origin')
  headers['Vary'] = 'Origin'
  if (origin && allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

export function isOriginAllowed(req: Request): boolean {
  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) return true
  const origin = req.headers.get('origin')
  // Non-browser clients send no Origin header; rate limiting still applies to them.
  if (!origin) return true
  return allowedOrigins.includes(origin.replace(/\/+$/, ''))
}

export function handlePreflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  return new Response(null, { status: 204, headers: corsHeaders(req) })
}
