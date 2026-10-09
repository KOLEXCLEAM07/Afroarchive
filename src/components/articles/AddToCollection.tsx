import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, FolderPlus, Loader2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface Option { id: string; title: string; is_public: boolean; has: boolean }

export default function AddToCollection({ articleId, articleSlug }: { articleId: string; articleSlug: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Option[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  useEffect(() => {
    if (!open || !user) return
    let cancelled = false
    Promise.all([
      supabase.from('collections').select('id, title, is_public').eq('owner_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('collection_items').select('collection_id').eq('article_id', articleId),
    ]).then(([cols, items]) => {
      if (cancelled) return
      const inSet = new Set((items.data ?? []).map(i => i.collection_id as string))
      setOptions(((cols.data ?? []) as Omit<Option, 'has'>[]).map(c => ({ ...c, has: inSet.has(c.id) })))
    })
    return () => { cancelled = true }
  }, [open, user, articleId])

  const toggle = async (opt: Option) => {
    setPending(opt.id)
    const { error } = opt.has
      ? await supabase.from('collection_items').delete().eq('collection_id', opt.id).eq('article_id', articleId)
      : await supabase.from('collection_items').insert({ collection_id: opt.id, article_id: articleId })
    setPending(null)
    if (error) { toast.error('Could not update the collection.'); return }
    setOptions(prev => prev?.map(o => (o.id === opt.id ? { ...o, has: !o.has } : o)) ?? null)
    toast.success(opt.has ? `Removed from “${opt.title}”` : `Added to “${opt.title}”`)
  }

  const handleOpen = () => {
    if (!user) {
      toast('Sign in to build collections')
      navigate('/auth/login', { state: { from: `/article/${articleSlug}` } })
      return
    }
    setOpen(o => !o)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-xl border border-transparent text-gray-600 dark:text-gray-400 hover:bg-sand-100 dark:hover:bg-dark-card transition-colors"
      >
        <FolderPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Add to collection</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 card p-2 z-40 animate-scale-in" role="menu">
          {options === null ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
          ) : options.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">You don’t have any collections yet.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {options.map(opt => (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={opt.has}
                    disabled={pending === opt.id}
                    onClick={() => toggle(opt)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-sand-100 dark:hover:bg-dark-card"
                  >
                    <span className="truncate">{opt.title}{!opt.is_public && <span className="text-xs text-gray-400"> · private</span>}</span>
                    <span className={cn('w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0', opt.has ? 'bg-primary-600 border-primary-600 text-white' : 'border-sand-300 dark:border-dark-border')}>
                      {pending === opt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : opt.has && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link to="/collections?new=1" className="mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-sand-100 dark:hover:bg-dark-card border-t border-sand-200 dark:border-dark-border">
            <Plus className="w-4 h-4" /> New collection
          </Link>
        </div>
      )}
    </div>
  )
}
