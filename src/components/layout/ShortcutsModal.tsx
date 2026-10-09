import React from 'react'
import { X, Search, Bookmark, Keyboard } from 'lucide-react'
import { useModalStack } from '../../hooks/useScrollLock'

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
    title: 'Museum',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open search (⌘ K on Mac)' },
      { keys: ['B'], description: 'Open saved items' },
      { keys: ['1 – 6'], description: 'Switch gallery (after leaving the intro)' },
      { keys: ['?'], description: 'Show or hide this guide' },
      { keys: ['Esc'], description: 'Close the open window or panel' },
    ],
  },
  {
    title: 'Accessibility',
    shortcuts: [
      { keys: ['Tab'], description: 'Move to the next control' },
      { keys: ['Shift', 'Tab'], description: 'Move to the previous control' },
      { keys: ['Enter', 'Space'], description: 'Activate the focused control' },
    ],
  },
  ...(import.meta.env.DEV
    ? [
        {
          title: 'Developer',
          shortcuts: [{ keys: ['Shift', 'D'], description: 'Toggle design token inspector' }],
        },
      ]
    : []),
]

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const panelRef = useModalStack<HTMLDivElement>(isOpen, onClose)

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-dark-surface border border-white/10 rounded-2xl shadow-2xl animate-fade-in outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-surface border-b border-white/10 px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-400/10 border border-accent-400/30 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-accent-400" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="shortcuts-modal-title"
                className="heading-md text-white"
              >
                Keyboard shortcuts
              </h2>
              <p className="text-xs text-ivory-400 mt-0.5">
                AfroArchive museum
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts guide"
            className="p-2 rounded-lg text-ivory-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-8">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="eyebrow mb-3">
                {group.title}
              </h3>
              <div>
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 group"
                  >
                    <span className="text-sm text-ivory-300 group-hover:text-ivory-100 transition-colors">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                      {shortcut.keys.map((key, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="inline-flex items-center justify-center min-w-[26px] h-6 rounded-md border border-white/15 bg-white/5 px-1.5 font-mono text-xs text-ivory-200">
                            {key}
                          </kbd>
                          {kIdx < shortcut.keys.length - 1 && (
                            <span className="text-xs text-ivory-500">+</span>
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
          <div className="flex flex-wrap gap-2 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <Search className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
              <span className="text-xs text-ivory-300">
                Ctrl+K — Search
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <Bookmark className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
              <span className="text-xs text-ivory-300">
                B — Saved items
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <Keyboard className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
              <span className="text-xs text-ivory-300">
                ? — This guide
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
