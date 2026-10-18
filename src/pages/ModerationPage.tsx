import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, EyeOff, Flag, History, Loader2, RotateCcw, ShieldCheck, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isUuid } from '@/lib/query'
import { knowledgeTypeLabel } from '@/lib/knowledge'
import { invalidatePagedQuery } from '@/hooks/usePagedQuery'
import { cn, formatRelativeDate } from '@/lib/utils'

type Tab = 'reports' | 'articles' | 'records' | 'audit'

const REASON_LABELS: Record<string, string> = {
  factual_error: 'Factual error',
  missing_source: 'Missing source',
  copyright: 'Copyright',
  off_topic: 'Off topic',
  offensive: 'Offensive',
  spam: 'Spam',
  other: 'Other',
}

interface ReportRow {
  id: string
  content_type: 'article' | 'record' | 'collection' | 'profile'
  content_id: string
  content_title: string | null
  reason: string
  description: string | null
  status: 'pending' | 'resolved' | 'dismissed'
  moderator_note: string | null
  created_at: string
  reporter: { username: string } | null
}

interface ArticleRow {
  id: string; title: string; slug: string; status: string; created_at: string
  author: { username: string } | null
}

interface RecordRow { id: string; slug: string; title: string; knowledge_type: string | null; updated_at: string | null }
interface AuditRow {
  id: string; target_type: 'article' | 'record' | 'report'; target_id: string; action: string; note: string | null; created_at: string
  actor: { username: string } | null
}

const AUDIT_LABELS: Record<string, string> = {
  report_resolved: 'Report resolved', report_dismissed: 'Report dismissed',
  article_under_review: 'Article sent to review', article_published: 'Article published',
  record_hidden: 'Record hidden', record_restored: 'Record restored',
}

function contentLink(r: ReportRow): string | null {
  if (r.content_type === 'collection') return `/collections/${r.content_id}`
  if (r.content_type === 'profile') return `/profile/${r.content_id}`
  return `/article/${r.content_id}`
}

export default function ModerationPage() {
  const { isModerator, loading } = useAuth()
  useDocumentTitle('Moderation')
  const [tab, setTab] = useState<Tab>('reports')

  if (loading) return <Spinner />
  if (!isModerator) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="card p-8 max-w-md text-center">
          <ShieldCheck className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h1 className="heading-md text-gray-900 dark:text-white mb-2">Moderators only</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">This page is for the editorial team.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-sand-50 dark:bg-dark-bg min-h-screen py-10">
      <div className="container-app">
        <h1 className="heading-xl text-3xl text-gray-900 dark:text-white mb-6">Moderation</h1>
        <div className="flex gap-1 border-b border-sand-200 dark:border-dark-border mb-6" role="tablist">
          {([['reports', 'Reports'], ['articles', 'Article review'], ['records', 'Hidden records'], ['audit', 'Audit log']] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === key ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'reports' && <ReportsTab />}
        {tab === 'articles' && <ArticlesTab />}
        {tab === 'records' && <RecordsTab />}
        {tab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-16" role="status"><Loader2 className="w-7 h-7 animate-spin text-primary-500" /></div>
}

async function hideRecordBySlug(idOrSlug: string, note?: string) {
  // Reports store a record's slug, but a slugless record falls back to its id
  // (see ArticleDetailPage's ReportButton), so accept either.
  const base = supabase.from('knowledge_items').select('id')
  const { data } = await (isUuid(idOrSlug) ? base.eq('id', idOrSlug) : base.eq('slug', idOrSlug)).maybeSingle()
  if (!data) throw new Error('Record not found')
  const { error } = await supabase.rpc('set_record_status', { p_record_id: data.id, p_status: 'flagged', p_note: note || null })
  if (error) throw error
  // A hidden record must vanish from browse/search straight away rather than
  // lingering in a cached page for up to a minute.
  invalidatePagedQuery()
}

async function setArticleStatus(id: string, status: 'published' | 'under_review', note?: string) {
  const { error } = await supabase.rpc('moderate_article', { p_article_id: id, p_status: status, p_note: note || null })
  if (error) throw error
  invalidatePagedQuery()
}

function ReportsTab() {
  const [status, setStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending')
  const [rows, setRows] = useState<ReportRow[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setRows(null)
    const { data, error } = await supabase.from('reports')
      .select('id, content_type, content_id, content_title, reason, description, status, moderator_note, created_at, reporter:profiles!reports_reporter_id_fkey(username)')
      .eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(100)
    if (error) { toast.error('Could not load reports. Has the moderation migration been run?'); setRows([]); return }
    setRows((data ?? []) as unknown as ReportRow[])
  }, [status])

  useEffect(() => { load() }, [load])

  const close = async (r: ReportRow, outcome: 'resolved' | 'dismissed') => {
    setBusy(r.id)
    const { error } = await supabase.rpc('moderate_report', {
      p_report_id: r.id, p_outcome: outcome, p_note: notes[r.id]?.trim() || null,
    })
    setBusy(null)
    if (error) { toast.error('Could not update the report.'); return }
    setRows(prev => prev?.filter(x => x.id !== r.id) ?? null)
    toast.success(outcome === 'resolved' ? 'Marked as resolved' : 'Report dismissed')
  }

  const act = async (r: ReportRow) => {
    setBusy(r.id)
    try {
      if (r.content_type === 'record') await hideRecordBySlug(r.content_id, notes[r.id])
      else if (r.content_type === 'article' && isUuid(r.content_id)) await setArticleStatus(r.content_id, 'under_review', notes[r.id])
      toast.success(r.content_type === 'record' ? 'Record hidden' : 'Article unpublished for review')
    } catch {
      toast.error('That action failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex gap-1.5 mb-4" role="group" aria-label="Report status">
        {(['pending', 'resolved', 'dismissed'] as const).map(s => (
          <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}
            className={cn('px-3 py-1 rounded-full text-xs font-semibold border capitalize',
              status === s ? 'bg-primary-600 text-white border-primary-600' : 'border-sand-200 dark:border-dark-border text-gray-600 dark:text-gray-300')}>
            {s}
          </button>
        ))}
      </div>

      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <p className="card p-8 text-center text-sm text-gray-500">No {status} reports.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(r => {
            const href = contentLink(r)
            const canAct = r.status === 'pending' && (r.content_type === 'record' || (r.content_type === 'article' && isUuid(r.content_id)))
            return (
              <li key={r.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                  <span className="badge badge-primary">{REASON_LABELS[r.reason] ?? r.reason}</span>
                  <span className="badge badge-gray capitalize">{r.content_type}</span>
                  <span className="text-gray-400">{formatRelativeDate(r.created_at)}{r.reporter?.username && <> by @{r.reporter.username}</>}</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {href ? <Link to={href} className="hover:underline">{r.content_title || r.content_id}</Link> : r.content_title || r.content_id}
                </p>
                {r.description && <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{r.description}</p>}
                {r.moderator_note && <p className="mt-2 text-xs text-gray-500">Note: {r.moderator_note}</p>}

                {r.status === 'pending' && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                    <label htmlFor={`note-${r.id}`} className="sr-only">Moderator note</label>
                    <input id={`note-${r.id}`} value={notes[r.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Note (optional)" maxLength={1000} className="input text-sm flex-1" />
                    <div className="flex gap-2">
                      {canAct && (
                        <button type="button" disabled={busy === r.id} onClick={() => act(r)} className="btn btn-outline btn-sm gap-1.5">
                          <EyeOff className="w-3.5 h-3.5" /> {r.content_type === 'record' ? 'Hide record' : 'Unpublish'}
                        </button>
                      )}
                      <button type="button" disabled={busy === r.id} onClick={() => close(r, 'resolved')} className="btn btn-primary btn-sm gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Resolve
                      </button>
                      <button type="button" disabled={busy === r.id} onClick={() => close(r, 'dismissed')} className="btn btn-ghost btn-sm gap-1.5">
                        <X className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ArticlesTab() {
  const [rows, setRows] = useState<ArticleRow[] | null>(null)

  useEffect(() => {
    supabase.from('articles')
      .select('id, title, slug, status, created_at, author:profiles!articles_author_id_fkey(username)')
      .in('status', ['published', 'under_review'])
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setRows((data ?? []) as unknown as ArticleRow[]))
  }, [])

  const toggle = async (a: ArticleRow) => {
    const next = a.status === 'published' ? 'under_review' : 'published'
    try {
      await setArticleStatus(a.id, next)
      setRows(prev => prev?.map(x => (x.id === a.id ? { ...x, status: next } : x)) ?? null)
      toast.success(next === 'published' ? 'Republished' : 'Unpublished for review')
    } catch {
      toast.error('Could not change the article status.')
    }
  }

  if (rows === null) return <Spinner />
  if (!rows.length) return <p className="card p-8 text-center text-sm text-gray-500">No articles yet.</p>

  return (
    <ul className="card divide-y divide-sand-200 dark:divide-dark-border">
      {rows.map(a => (
        <li key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="min-w-0">
            <Link to={`/article/${a.slug}`} className="font-medium text-gray-900 dark:text-white hover:underline line-clamp-1">{a.title}</Link>
            <p className="text-xs text-gray-400">
              {a.author?.username ? `@${a.author.username} · ` : ''}{formatRelativeDate(a.created_at)}
              {a.status === 'under_review' && <span className="ml-2 badge bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Under review</span>}
            </p>
          </div>
          <button type="button" onClick={() => toggle(a)} className="btn btn-outline btn-sm gap-1.5 self-start sm:self-auto">
            {a.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><RotateCcw className="w-3.5 h-3.5" /> Republish</>}
          </button>
        </li>
      ))}
    </ul>
  )
}

function RecordsTab() {
  const [rows, setRows] = useState<RecordRow[] | null>(null)

  useEffect(() => {
    supabase.from('knowledge_items').select('id, slug, title, knowledge_type, updated_at')
      .eq('verification_status', 'flagged').order('updated_at', { ascending: false }).limit(100)
      .then(({ data }) => setRows((data ?? []) as RecordRow[]))
  }, [])

  const restore = async (r: RecordRow) => {
    const { error } = await supabase.rpc('set_record_status', { p_record_id: r.id, p_status: 'normalized', p_note: null })
    if (error) { toast.error('Could not restore the record.'); return }
    setRows(prev => prev?.filter(x => x.id !== r.id) ?? null)
    toast.success('Record restored')
  }

  if (rows === null) return <Spinner />
  if (!rows.length) {
    return (
      <p className="card p-8 text-center text-sm text-gray-500">
        <Flag className="w-5 h-5 mx-auto mb-2 text-gray-400" />
        No hidden records. Records hidden from a report appear here and can be restored.
      </p>
    )
  }
  return (
    <ul className="card divide-y divide-sand-200 dark:divide-dark-border">
      {rows.map(r => (
        <li key={r.id} className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{r.title}</p>
            <p className="text-xs text-gray-400">{knowledgeTypeLabel(r.knowledge_type)}{r.updated_at && ` · hidden ${formatRelativeDate(r.updated_at)}`}</p>
          </div>
          <button type="button" onClick={() => restore(r)} className="btn btn-outline btn-sm gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Restore</button>
        </li>
      ))}
    </ul>
  )
}

function AuditTab() {
  const [rows, setRows] = useState<AuditRow[] | null>(null)

  useEffect(() => {
    supabase.from('moderation_actions')
      .select('id, target_type, target_id, action, note, created_at, actor:profiles!moderation_actions_actor_id_fkey(username)')
      .order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => {
        if (error) { toast.error('Could not load the moderation audit log.'); setRows([]); return }
        setRows((data ?? []) as unknown as AuditRow[])
      })
  }, [])

  if (rows === null) return <Spinner />
  if (!rows.length) return <p className="card p-8 text-center text-sm text-gray-500">No moderation actions have been recorded yet.</p>

  return (
    <ul className="card divide-y divide-sand-200 dark:divide-dark-border">
      {rows.map(row => (
        <li key={row.id} className="flex gap-3 p-4">
          <History className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{AUDIT_LABELS[row.action] ?? row.action}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {row.actor?.username ? `@${row.actor.username}` : 'A former moderator'} · {formatRelativeDate(row.created_at)} · {row.target_type}
            </p>
            {row.note && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{row.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
