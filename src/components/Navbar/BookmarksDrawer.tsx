import React, { useEffect } from 'react'
import { X, Bookmark, Trash2, ArrowUpRight, BookOpen, Compass } from 'lucide-react'
import { BookmarkEntry } from '../../hooks/useBookmarks'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { STORIES_DATA } from '../../data/storyData'
import { ArtifactItem } from '../../types/archiveTypes'
import { StoryItem } from '../../types/storyTypes'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface BookmarksDrawerProps {
  isOpen: boolean
  onClose: () => void
  bookmarks: BookmarkEntry[]
  onRemoveBookmark: (id: string) => void
  onInspectArtifact: (artifact: ArtifactItem) => void
  onReadStory: (story: StoryItem) => void
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onInspectArtifact,
  onReadStory,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Saved Heritage Items"
      className="fixed inset-0 z-50 bg-charcoal-950/90 backdrop-blur-md flex justify-end animate-fade-in"
    >
      {/* Backdrop overlay click listener */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      {/* Slide-over Drawer Container */}
      <div className="relative w-full max-w-md bg-charcoal-900 border-l border-ivory-100/15 h-full overflow-y-auto shadow-museum z-10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
        
        {/* Drawer Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-ivory-100/10 pb-4">
            <div className="flex items-center space-x-3">
              <Bookmark className="w-5 h-5 text-bronze-400 fill-bronze-400" />
              <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                SAVED HERITAGE COLLECTION ({bookmarks.length})
              </span>
            </div>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close saved items"
              className="p-1.5 text-ivory-400 hover:text-bronze-300 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="font-sans text-xs text-ivory-300 font-light leading-relaxed">
            Your personal saved study list of manuscripts, artifacts, and philosophical texts (persisted locally).
          </p>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {bookmarks.length > 0 ? (
            bookmarks.map((b) => (
              <div
                key={b.id}
                className="group p-4 rounded bg-charcoal-850 border border-ivory-100/10 hover:border-bronze-400/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant="bronze" size="sm">
                      {b.type.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-[10px] text-ivory-400 uppercase truncate">
                      {b.catalogOrCategory}
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-sm text-ivory-100 group-hover:text-bronze-300 truncate">
                    {b.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      if (b.type === 'artifact') {
                        const art = ARTIFACTS_DATA.find((a) => a.id === b.id)
                        if (art) onInspectArtifact(art)
                      } else {
                        const st = STORIES_DATA.find((s) => s.id === b.id)
                        if (st) onReadStory(st)
                      }
                      onClose()
                    }}
                    type="button"
                    title="Inspect item"
                    className="p-2 text-ivory-300 hover:text-bronze-300 rounded focus:outline-none"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRemoveBookmark(b.id)}
                    type="button"
                    title="Remove from saved list"
                    className="p-2 text-ivory-500 hover:text-red-400 rounded focus:outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 space-y-3">
              <Compass className="w-8 h-8 text-ivory-500 mx-auto" />
              <h4 className="font-display text-base text-ivory-200">No Saved Items Yet</h4>
              <p className="font-sans text-xs text-ivory-400">
                Click the bookmark icon on any artifact card or philosophy story to save it to your personal collection.
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-ivory-100/10 text-center font-mono text-[10px] text-ivory-400">
          <span>PRESERVE. DISCOVER. EMPOWER.</span>
        </div>
      </div>
    </div>
  )
}
