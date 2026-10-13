import { BookOpen, Bookmark, Edit3, Feather } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProfileTab = 'articles' | 'write' | 'saved' | 'settings'

interface ProfileTabNavigationProps {
  activeTab: ProfileTab
  articleCount: number
  bookmarkCount: number
  editingArticle: boolean
  isOwner: boolean
  onChange: (tab: ProfileTab) => void
}

export default function ProfileTabNavigation({
  activeTab, articleCount, bookmarkCount, editingArticle, isOwner, onChange,
}: ProfileTabNavigationProps) {
  const tabs = [
    { key: 'articles' as const, icon: BookOpen, label: `Articles (${articleCount})` },
    ...(isOwner ? [
      { key: 'write' as const, icon: Feather, label: editingArticle ? 'Edit Article' : 'Write Article' },
      { key: 'saved' as const, icon: Bookmark, label: `Saved Heritage (${bookmarkCount})` },
      { key: 'settings' as const, icon: Edit3, label: 'Edit Profile' },
    ] : []),
  ]

  return (
    <div className="mt-8 border-b border-sand-200 dark:border-dark-border flex items-center gap-6 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          type="button"
          className={cn(
            'flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === tab.key
              ? 'border-primary-500 text-primary-600 dark:text-accent-400 dark:border-accent-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
