// Imported media descriptions are often the raw text of a provider's catalogue
// page: Internet Archive book metadata, OCR of a scanned page, David Rumsey map
// notes, or a photographer's reuse instructions. None of that describes the item
// itself, so it is stripped before a record is shown or indexed.

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&#xa0;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
}

const ENTITY_RE = /&(?:nbsp|#160|#xa0|amp|lt|gt|quot|#34|#39|#x27|apos);/gi

/** Turns HTML entities (which providers escape inside plain-text fields) back into text. */
export function decodeHtmlEntities(input: string): string {
  return input.replace(ENTITY_RE, match => ENTITIES[match.toLowerCase()] ?? match)
}

/**
 * Drops markup. Anchors go together with their text because imported links are
 * only ever source URLs or reuse instructions, never part of the description.
 */
export function stripMarkup(input: string): string {
  return input.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' ').replace(/<[^>]*>/g, ' ')
}

/** From these markers onward the text is catalogue data, OCR or reuse instructions. */
const CATALOGUE_START: RegExp[] = [
  /\bIdentifier:\s*\S+\s*\(find matches\)/i, // Internet Archive item header
  /\bTitle:\s*(?=[\s\S]{0,400}?\bIdentifier:)/i, // …which sometimes starts with the title
  /\bText Appearing (?:Before|After) Image\b/i, // OCR of the scanned page
  /\bNote About Images\b/i, // Internet Archive footer
  /\bSource:\s*Asiatic Society of Mumbai/i, // Granth Sanjeevani scans
  /\bWikipedia Loves Art\b/i, // Wiki Loves Art project note
  /\bPERMISSION TO USE\b/i, // Flickr reuse notice
  /\bFor more (?:photos|information)\b/i, // photographer's promotion
  /\bTo learn more about\b/i, // social-media promotion
  /\bsee my story at\b/i,
  /\bThese images are cleared for release\b/i,
]

/** Presence of any of these means the description is a provider catalogue page,
 *  so its trailing "Subjects:" list can also be trusted to be catalogue noise. */
const CATALOGUE_MARKER =
  /(?:find matches|text appearing|note about images|digitizing sponsor|contributing library|view book page|davidrumsey\.com|asiatic society of mumbai|wikipedia loves art|zoomable full resolution|permission to use|for more photos|for more information|to learn more about|cleared for release|subjects:|statement of responsibility)/i

/** A cleaned description that is only a catalogue fragment adds nothing. */
const JUNK_ONLY: RegExp[] = [
  /^$/,
  /^(?:an abridged edition|includes\b|translation of\b|color\.?|subjects:?|source:?|school|statement of responsibility|p\.\s*\d|\d+\s*v\.\s*:|v\.\s*\d|www\.|https?:)/i,
]

/**
 * True when a description is a provider catalogue page (or contains escaped
 * markup), rather than prose written about the item. Used to scope one-off
 * cleanups so cosmetic whitespace edits do not touch every record.
 */
export function hasImportedNoise(raw: string | null | undefined): boolean {
  if (!raw) return false
  return CATALOGUE_MARKER.test(raw) || /&lt;a\b/i.test(raw) || /<a\b/i.test(raw)
}

/**
 * Returns a readable description of an imported item, or null when the provider
 * only supplied catalogue metadata, OCR or reuse instructions.
 */
export function cleanRecordDescription(raw: string | null | undefined): string | null {
  if (!raw) return null
  let text = stripMarkup(decodeHtmlEntities(raw))

  const catalogue = CATALOGUE_MARKER.test(text)

  // David Rumsey map-scan preamble.
  text = text
    .replace(/Zoomable full resolution image available at davidrumsey\.com\.?/gi, ' ')
    .replace(/This image [\d.]+ is a part of image group \d+\.\d+\.?/gi, ' ')

  // Keep only what precedes the first catalogue or reuse marker.
  let end = text.length
  for (const re of CATALOGUE_START) {
    const match = re.exec(text)
    if (match && match.index < end) end = match.index
  }
  text = text.slice(0, end)

  if (catalogue) text = text.replace(/\bSubjects:[\s\S]*$/i, ' ')

  // Leftover phrases from multi-sentence reuse instructions.
  text = text
    .replace(/\bplease add a comment[^.]*?(?:\.|$)/gi, ' ')
    .replace(/\bProject galleries on Flickr:[^.]*?(?:\.|$)/gi, ' ')
    .replace(/\bOfficial YouTube Channel[^.]*?(?:\.|$)/gi, ' ')
    .replace(/\bFollow [^.]*? on Twitter[^.]*?(?:\.|$)/gi, ' ')

  // Wiki link prefixes ("w:Great Mosque", "commons:File") and tidied punctuation.
  text = text
    .replace(/(^|[\s(,])(?:w|en|fr|commons|wikipedia):(?=\S)/gi, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
    .replace(/^[\s.,;:]+/, '')
    .trim()

  if (JUNK_ONLY.some(re => re.test(text))) return null
  return text || null
}
