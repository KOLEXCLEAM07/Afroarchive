/**
 * AfroArchive Ingestion Framework - Polite HTTP helpers
 * Shared User-Agent, request throttling, timeouts and retry on 429 / 5xx.
 */

export const USER_AGENT = 'AfroArchive-Ingestion/1.0 (open heritage archive)';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Guarantees a minimum interval between consecutive requests made through it. */
export class Throttle {
  private last = 0;
  constructor(private readonly minIntervalMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const delay = this.last + this.minIntervalMs - now;
    if (delay > 0) await sleep(delay);
    this.last = Date.now();
  }
}

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export interface FetchJsonOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  retries?: number;
  throttle?: Throttle;
  /** Extra status codes to retry (e.g. 403 from bot-protection layers). */
  retryOn?: number[];
}

/**
 * Fetches JSON with a timeout. Retries on network errors, 429 and 5xx with
 * exponential backoff (honouring Retry-After). 4xx errors are thrown immediately.
 */
export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  let attempt = 0;
  for (;;) {
    if (opts.throttle) await opts.throttle.wait();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);
    try {
      const res = await fetch(url, {
        method: opts.method || 'GET',
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...opts.headers },
        body: opts.body,
        signal: controller.signal,
      });
      if (res.ok) return (await res.json()) as T;
      const retryable = res.status === 429 || res.status >= 500 || Boolean(opts.retryOn?.includes(res.status));
      if (!retryable || attempt >= retries) {
        throw new HttpError(res.status, `HTTP ${res.status} ${res.statusText} for ${url.slice(0, 200)}`);
      }
      const retryAfter = Number(res.headers.get('retry-after'));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * Math.pow(2, attempt);
      console.warn(`   ↻ HTTP ${res.status} from ${new URL(url).host}; retrying in ${Math.round(backoff / 1000)}s...`);
      await sleep(backoff);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      if (attempt >= retries) throw err;
      const backoff = 2000 * Math.pow(2, attempt);
      console.warn(`   ↻ Network error (${err instanceof Error ? err.message : String(err)}); retrying in ${backoff / 1000}s...`);
      await sleep(backoff);
    } finally {
      clearTimeout(timer);
    }
    attempt++;
  }
}

/** Removes HTML tags and decodes the most common entities. */
export function stripHtml(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapses whitespace only — institution titles are otherwise kept verbatim. */
export function cleanText(input?: string | null): string {
  return (input || '').replace(/\s+/g, ' ').trim();
}

/** ASCII kebab-case slug fragment (diacritics removed). */
export function kebab(input: string, max = 80): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, max)
    .replace(/-$/, '');
}

/** Builds labelled "Label: value" lines, omitting empty values. */
export function labelledLines(pairs: Array<[string, string | undefined | null]>): string {
  return pairs
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `${k}: ${cleanText(String(v))}`)
    .join('\n');
}

/** Leading whole sentences of `text`, up to roughly `max` characters (never cut mid-sentence unless one sentence is longer). */
export function leadSentences(text: string, max = 400): string {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z"“'‘(])/);
  let out = '';
  for (const s of sentences) {
    if (out && out.length + s.length + 1 > max) break;
    out = out ? `${out} ${s}` : s;
  }
  return out.length > max * 2 ? `${out.slice(0, max).replace(/\s+\S*$/, '')}…` : out;
}

export function guessImageMime(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'tif' || ext === 'tiff') return 'image/tiff';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}
