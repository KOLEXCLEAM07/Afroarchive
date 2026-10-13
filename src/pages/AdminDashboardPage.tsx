import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Archive, ArrowUpRight, BookOpenText, CircleAlert, Database, FileText, Loader2, ShieldCheck, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatRelativeDate } from '@/lib/utils'

type DashboardStats = {
  members: number | null
  publishedArticles: number | null
  pendingArticles: number | null
  pendingReports: number | null
  flaggedRecords: number | null
  records: number | null
}

type Activity = {
  id: string
  title: string
  detail: string
  createdAt: string
  href: string
  kind: 'report' | 'article'
}

const EMPTY_STATS: DashboardStats = {
  members: null,
  publishedArticles: null,
  pendingArticles: null,
  pendingReports: null,
  flaggedRecords: null,
  records: null,
}

export default function AdminDashboardPage() {
  const { isAdmin, loading } = useAuth()
  useDocumentTitle('Admin dashboard')
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [activity, setActivity] = useState<Activity[] | null>(null)

  useEffect(() => {
    if (!isAdmin) return

    let cancelled = false
    const load = async () => {
      const [members, publishedArticles, pendingArticles, pendingReports, flaggedRecords, records, reports, articles] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('knowledge_items').select('id', { count: 'exact', head: true }).eq('verification_status', 'flagged'),
        supabase.from('knowledge_items').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id, content_title, content_type, reason, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('articles').select('id, title, slug, status, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      if (cancelled) return
      setStats({
        members: members.count,
        publishedArticles: publishedArticles.count,
        pendingArticles: pendingArticles.count,
        pendingReports: pendingReports.count,
        flaggedRecords: flaggedRecords.count,
        records: records.count,
      })

      const recentReports: Activity[] = (reports.data ?? []).map(report => ({
        id: `report-${report.id}`,
        title: report.content_title || 'Untitled report',
        detail: `New ${report.reason.replaceAll('_', ' ')} report on a ${report.content_type}`,
        createdAt: report.created_at,
        href: '/moderation',
        kind: 'report',
      }))
      const recentArticles: Activity[] = (articles.data ?? []).map(article => ({
        id: `article-${article.id}`,
        title: article.title,
        detail: article.status === 'under_review' ? 'Article awaiting review' : 'Article published',
        createdAt: article.created_at,
        href: `/article/${article.slug}`,
        kind: 'article',
      }))
      setActivity([...recentReports, ...recentArticles].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8))
    }

    load()
    return () => { cancelled = true }
  }, [isAdmin])

  if (loading) return <LoadingState />
  if (!isAdmin) return <AccessDenied />

  const statCards = [
    { label: 'Members', value: stats.members, hint: 'Registered profiles', icon: Users, tone: 'text-sky-600 dark:text-sky-400' },
    { label: 'Published essays', value: stats.publishedArticles, hint: 'Visible to readers', icon: BookOpenText, tone: 'text-primary-600 dark:text-primary-400' },
    { label: 'Open reports', value: stats.pendingReports, hint: 'Need editorial review', icon: CircleAlert, tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Archive records', value: stats.records, hint: `${stats.flaggedRecords ?? 0} hidden for review`, icon: Archive, tone: 'text-violet-600 dark:text-violet-400' },
  ]

  return (
    <div className="min-h-screen bg-sand-50 py-10 dark:bg-dark-bg">
      <div className="container-app space-y-8">
        <header className="flex flex-col gap-4 border-b border-sand-200 pb-7 dark:border-dark-border sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Site administration
            </div>
            <h1 className="heading-xl text-3xl text-gray-900 dark:text-white">Admin dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">A concise view of AfroArchive’s publishing, community, and archive health.</p>
          </div>
          <Link to="/moderation" className="btn btn-primary btn-sm gap-1.5 self-start sm:self-auto">
            Open moderation <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </header>

        <section aria-label="Site overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, hint, icon: Icon, tone }) => (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value === null ? '—' : value.toLocaleString()}</p>
                </div>
                <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4 dark:border-dark-border">
              <div>
                <h2 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">Recent activity</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Latest moderation work and article activity.</p>
              </div>
              <Database className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            {activity === null ? <LoadingState /> : activity.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">No recent editorial activity.</p>
            ) : (
              <ul className="divide-y divide-sand-200 dark:divide-dark-border">
                {activity.map(item => (
                  <li key={item.id}>
                    <Link to={item.href} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-sand-50 dark:hover:bg-dark-card">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.kind === 'report' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'}`}>
                        {item.kind === 'report' ? <CircleAlert className="h-4 w-4" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{item.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">{item.detail}</span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">{formatRelativeDate(item.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="card p-5">
            <h2 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">Administration</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use focused workspaces for changes that affect readers.</p>
            <div className="mt-5 space-y-2">
              <AdminLink to="/moderation" icon={<CircleAlert className="h-4 w-4" />} title="Moderation queue" description={`${stats.pendingReports ?? 0} open reports · ${stats.pendingArticles ?? 0} essays in review`} />
              <AdminLink to="/discover?type=records" icon={<Archive className="h-4 w-4" />} title="Archive records" description={`${stats.records ?? 0} records · review imports and source material`} />
              <AdminLink to="/collections" icon={<BookOpenText className="h-4 w-4" />} title="Collections" description="Review public collections and their curation" />
              <AdminLink to="/write" icon={<FileText className="h-4 w-4" />} title="Create an editorial article" description="Write and publish an archive essay" />
            </div>
            <p className="mt-5 border-t border-sand-200 pt-4 text-xs leading-relaxed text-gray-500 dark:border-dark-border dark:text-gray-400">Member roles and database configuration remain protected in Supabase. Only project owners should change access roles there.</p>
          </aside>
        </section>
      </div>
    </div>
  )
}

function AdminLink({ to, icon, title, description }: { to: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-sand-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-dark-border dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10">
      <span className="text-primary-600 dark:text-primary-400">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{description}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

function LoadingState() {
  return <div className="flex min-h-32 items-center justify-center" role="status" aria-label="Loading dashboard"><Loader2 className="h-7 w-7 animate-spin text-primary-500" /></div>
}

function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="card max-w-md p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-gray-400" aria-hidden="true" />
        <h1 className="heading-md text-gray-900 dark:text-white">Administrators only</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This dashboard is reserved for site administrators.</p>
      </div>
    </div>
  )
}
