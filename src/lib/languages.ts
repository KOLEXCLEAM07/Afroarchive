// Languages members can write in. Codes are ISO 639-1 where one exists, else ISO 639-3.
export const ARTICLE_LANGUAGES: Array<{ code: string; name: string; native: string }> = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'ha', name: 'Hausa', native: 'Hausa' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', native: 'Igbo' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa' },
  { code: 'so', name: 'Somali', native: 'Soomaali' },
  { code: 'om', name: 'Oromo', native: 'Afaan Oromoo' },
  { code: 'wo', name: 'Wolof', native: 'Wolof' },
  { code: 'bm', name: 'Bambara', native: 'Bamanankan' },
  { code: 'ln', name: 'Lingala', native: 'Lingála' },
  { code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda' },
  { code: 'sn', name: 'Shona', native: 'chiShona' },
  { code: 'tw', name: 'Twi', native: 'Twi' },
  { code: 'ff', name: 'Fula', native: 'Fulfulde' },
]

const RTL = new Set(['ar'])

export function languageName(code: string | null | undefined): string | null {
  if (!code) return null
  return ARTICLE_LANGUAGES.find(l => l.code === code)?.name ?? code
}

export function isRtl(code: string | null | undefined): boolean {
  return !!code && RTL.has(code)
}
