import React from 'react'
import { Link } from 'react-router-dom'
import { X, Bookmark, Trash2, ArrowUpRight, Compass } from 'lucide-react'
import { BookmarkEntry } from '../../hooks/useBookmarks'
import { useModalStack } from '../../hooks/useScrollLock'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { STORIES_DATA } from '../../data/storyData'
import { ArtifactItem } from '../../types/archiveTypes'
import { StoryItem } from '../../types/storyTypes'
import { Badge } from '../ui/Badge'

export interface BookmarksDrawerProps {
  isOpen: boolean
  onClose: () => void
  bookmarks: BookmarkEntry[]
  onRemoveBookmark: (id: string) => void
  onInspectArtifact: (artifact: ArtifactItem) => void
  onReadStory: (story: StoryItem) => void
}

const openButtonClass =
  'p-2 rounded-lg text-ivory-300 hover:text-accent-300 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400'

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onInspectArtifact,
  onReadStory,
}) => {
  const panelRef = useModalStack<HTMLDivElement>(isOpen, onClose)

  if (!isOpen) return null

  const renderOpenAction = (b: BookmarkEntry) => {
    const label = `Open ${b.title}`

    if (b.type === 'artifact') {
      const art = ARTIFACTS_DATA.find((a) => a.id === b.id)
      if (art) {
        return (
          <button
            onClick={() => {
              onClose()
              onInspectArtifact(art)
            }}
            type="button"
            aria-label={label}
            title="Open"
            className={openButtonClass}
          >
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )
      }
    }

    if (b.type === 'story') {
      const st = STORIES_DATA.find((s) => s.id === b.id)
      if (st) {
        return (
          <button
            onClick={() => {
              onClose()
              onReadStory(st)
            }}
            type="button"
            aria-label={label}
            title="Open"
            className={openButtonClass}
          >
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )
      }
    }

    const href = b.href || (b.type === 'article' ? `/article/${b.id}` : null)
    if (!href) return null

    return (
      <Link to={href} onClick={onClose} aria-label={label} title="Open" className={openButtonClass}>
        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmarks-drawer-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
    >
      {/* Backdrop overlay click listener */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      {/* Slide-over Drawer Container */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md bg-dark-surface border border-white/10 rounded-l-2xl h-full overflow-y-auto shadow-2xl z-10 p-6 sm:p-8 flex flex-col justify-between space-y-6 outline-none"
      >
        
        {/* Drawer Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-accent-400 fill-accent-400" aria-hidden="true" />
              <h2 id="bookmarks-drawer-title" className="heading-md text-white">
                Saved items ({bookmarks.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close saved items"
              className="p-2 rounded-lg text-ivory-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <p className="text-sm text-ivory-400 leading-relaxed">
            Manuscripts, objects, stories and articles you have saved. Saved items are kept in this browser.
          </p>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {bookmarks.length > 0 ? (
            bookmarks.map((b) => (
              <div
                key={b.id}
                className="group p-4 rounded-xl bg-dark-card border border-white/10 hover:border-accent-400/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="bronze" size="sm">
                      {b.type}
                    </Badge>
                    <span className="text-xs text-ivory-400 truncate">
                      {b.catalogOrCategory}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg leading-snug text-white group-hover:text-accent-300 truncate">
                    {b.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {renderOpenAction(b)}

                  <button
                    onClick={() => onRemoveBookmark(b.id)}
                    type="button"
                    aria-label={`Remove ${b.title} from saved items`}
                    title="Remove"
                    className="p-2 rounded-lg text-ivory-500 hover:text-red-400 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 space-y-3">
              <Compass className="w-8 h-8 text-ivory-500 mx-auto" aria-hidden="true" />
              <h3 className="font-serif font-bold text-xl text-ivory-100">No saved items yet</h3>
              <p className="text-sm text-ivory-400">
                Use the bookmark icon on any object or story to save it here.
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-white/10 text-center text-xs text-ivory-500">
          <span>Press <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 font-mono text-xs text-ivory-300">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  )
}
