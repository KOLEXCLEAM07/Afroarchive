import { useCallback, useSyncExternalStore } from 'react'

const BOOKMARKS_KEY = 'afroarchive_saved_bookmarks_v1'

export interface BookmarkEntry {
  id: string
  type: 'artifact' | 'story' | 'article'
  title: string
  subtitle?: string
  catalogOrCategory: string
  savedAt: string
  /** In-app link to reopen the item (articles and archive records). */
  href?: string
}

// One store shared by every component, kept in sync across browser tabs.
let cache: BookmarkEntry[] | null = null
const listeners = new Set<() => void>()

function read(): BookmarkEntry[] {
  if (cache) return cache
  try {
    const parsed = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
    cache = Array.isArray(parsed) ? parsed : []
  } catch {
    cache = []
  }
  return cache
}

function write(next: BookmarkEntry[]) {
  cache = next
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
  } catch (e) {
    console.warn('Failed to save bookmarks:', e)
  }
  listeners.forEach(l => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === BOOKMARKS_KEY) { cache = null; listener() }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useBookmarks() {
  const bookmarks = useSyncExternalStore(subscribe, read, () => [])

  const isBookmarked = useCallback((id: string) => bookmarks.some(b => b.id === id), [bookmarks])

  const toggleBookmark = useCallback((entry: BookmarkEntry) => {
    const current = read()
    write(current.some(b => b.id === entry.id) ? current.filter(b => b.id !== entry.id) : [...current, entry])
  }, [])

  const removeBookmark = useCallback((id: string) => {
    write(read().filter(b => b.id !== id))
  }, [])

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark, count: bookmarks.length }
}
