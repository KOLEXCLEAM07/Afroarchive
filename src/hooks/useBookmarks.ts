import { useState, useEffect } from 'react'

const BOOKMARKS_KEY = 'afroarchive_saved_bookmarks_v1'

export interface BookmarkEntry {
  id: string
  type: 'artifact' | 'story'
  title: string
  subtitle?: string
  catalogOrCategory: string
  savedAt: string
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
    } catch (e) {
      console.warn('Failed to save bookmarks to LocalStorage:', e)
    }
  }, [bookmarks])

  const isBookmarked = (id: string) => {
    return bookmarks.some((b) => b.id === id)
  }

  const toggleBookmark = (entry: BookmarkEntry) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === entry.id)) {
        return prev.filter((b) => b.id !== entry.id)
      } else {
        return [...prev, entry]
      }
    })
  }

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    count: bookmarks.length,
  }
}
