import React, { useEffect } from 'react'
import { X, Search, Bookmark, Keyboard } from 'lucide-react'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', '1'], description: 'Jump to Hero / Exhibition Opening' },
      { keys: ['G', '2'], description: 'Jump to Archive Explorer' },
      { keys: ['G', '3'], description: 'Jump to Civilizations Timeline' },
      { keys: ['G', '4'], description: 'Jump to Interactive Africa Map' },
      { keys: ['G', '5'], description: 'Jump to Stories & Philosophies' },
      { keys: ['G', '6'], description: 'Jump to AI Curator' },
      { keys: ['G', '7'], description: 'Jump to About & Mission' },
    ],
  },
  {
    title: 'Exhibition Controls',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open Global Search' },
      { keys: ['Ctrl', 'K'], description: 'Open Global Search (Windows/Linux)' },
      { keys: ['B'], description: 'Toggle Bookmarks Drawer' },
      { keys: ['Esc'], description: 'Close any open modal or drawer' },
    ],
  },
  {
    title: 'Developer Tools',
    shortcuts: [
      { keys: ['Shift', 'D'], description: 'Toggle Design Token Inspector' },
    ],
  },
  {
    title: 'Accessibility',
    shortcuts: [
      { keys: ['Tab'], description: 'Navigate interactive elements forward' },
      { keys: ['Shift', 'Tab'], description: 'Navigate interactive elements backward' },
      { keys: ['Enter', 'Space'], description: 'Activate focused element' },
      { keys: ['?'], description: 'Show this keyboard shortcuts guide' },
    ],
  },
]

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal-950/85 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-charcoal-900 border border-ivory-100/12 rounded-sm shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-charcoal-900 border-b border-ivory-100/10 px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-sm bg-bronze-400/10 border border-bronze-400/30 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-bronze-400" />
            </div>
            <div>
              <h2
                id="shortcuts-modal-title"
                className="font-display text-base font-semibold text-ivory-100 tracking-wide"
              >
                Keyboard Shortcuts
              </h2>
              <p className="font-mono text-[9px] text-ivory-500 tracking-widest uppercase mt-0.5">
                AFROARCHIVE Exhibition Controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts guide"
            className="p-2 text-ivory-500 hover:text-ivory-100 hover:bg-charcoal-800 rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-8">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-400 mb-4">
                {group.title}
              </h3>
              <div className="space-y-2.5">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 border-b border-ivory-100/5 last:border-0 group"
                  >
                    <span className="font-sans text-sm text-ivory-300 group-hover:text-ivory-100 transition-colors">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center space-x-1.5 flex-shrink-0 ml-4">
                      {shortcut.keys.map((key, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-charcoal-800 border border-ivory-100/15 rounded text-ivory-200 font-mono text-[11px] shadow-sm">
                            {key}
                          </kbd>
                          {kIdx < shortcut.keys.length - 1 && (
                            <span className="font-mono text-[9px] text-ivory-600">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Action Row */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-ivory-100/8">
            <div className="flex items-center space-x-2 px-3 py-2 bg-charcoal-800/60 border border-ivory-100/8 rounded-sm">
              <Search className="w-3.5 h-3.5 text-bronze-400" />
              <span className="font-mono text-[10px] text-ivory-400 tracking-wider">
                CTRL+K — Global Search
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-charcoal-800/60 border border-ivory-100/8 rounded-sm">
              <Bookmark className="w-3.5 h-3.5 text-bronze-400" />
              <span className="font-mono text-[10px] text-ivory-400 tracking-wider">
                B — Saved Items
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-charcoal-800/60 border border-ivory-100/8 rounded-sm">
              <Keyboard className="w-3.5 h-3.5 text-bronze-400" />
              <span className="font-mono text-[10px] text-ivory-400 tracking-wider">
                ? — This Guide
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
