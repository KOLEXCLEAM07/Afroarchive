export type GalleryTab = 'collections' | 'timeline' | 'map' | 'stories' | 'ai' | 'about'

export const GALLERY_TAB_KEYS: GalleryTab[] = ['collections', 'timeline', 'map', 'stories', 'ai', 'about']

export function isGalleryTab(value: string | null | undefined): value is GalleryTab {
  return !!value && (GALLERY_TAB_KEYS as string[]).includes(value)
}
