import { Link } from 'react-router-dom'
import { Clock, Heart, Bookmark, Eye } from 'lucide-react'
import { cn, formatRelativeDate, formatNumber, getAvatarFallback, getAvatarColor } from '@/lib/utils'
import type { Article } from '@/types'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'compact' | 'featured' | 'horizontal'
  className?: string
}

export default function ArticleCard({ article, variant = 'default', className }: ArticleCardProps) {
  if (variant === 'featured') return <FeaturedCard article={article} className={className} />
  if (variant === 'horizontal') return <HorizontalCard article={article} className={className} />
  if (variant === 'compact') return <CompactCard article={article} className={className} />
  return <DefaultCard article={article} className={className} />
}

function DefaultCard({ article, className }: { article: Article; className?: string }) {
  return (
    <article className={cn('card-hover flex flex-col overflow-hidden group', className)}>
      {article.cover_image && (
        <Link to={`/article/${article.slug}`} className="block overflow-hidden aspect-[16/9]">
          <img
            src={article.cover_image}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      )}
      <div className="flex flex-col flex-1 p-5">
        {article.category && (
          <Link
            to={`/discover?category=${article.category.slug}`}
            className="badge badge-primary mb-3 self-start hover:bg-primary-100 dark:hover:bg-primary-500/30 transition-colors"
          >
            {article.category.name}
          </Link>
        )}
        <Link to={`/article/${article.slug}`}>
          <h2 className="font-serif font-bold text-lg text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {article.title}
          </h2>
        </Link>
        {article.excerpt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3">
          <AuthorChip author={article.author} date={article.published_at} />
          <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
            <StatChip icon={<Clock className="w-3.5 h-3.5" />} value={`${article.reading_time}m`} />
            <StatChip icon={<Heart className="w-3.5 h-3.5" />} value={formatNumber(article.likes_count)} />
          </div>
        </div>
      </div>
    </article>
  )
}

function FeaturedCard({ article, className }: { article: Article; className?: string }) {
  return (
    <article className={cn('card-hover overflow-hidden group relative min-h-[420px] flex flex-col justify-end', className)}>
      {article.cover_image ? (
        <img
          src={article.cover_image}
          alt={article.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 animated-gradient" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="relative z-10 p-6">
        {article.category && (
          <Link
            to={`/discover?category=${article.category.slug}`}
            className="badge bg-white/20 text-white backdrop-blur-sm mb-3 self-start hover:bg-white/30 transition-colors"
          >
            {article.category.name}
          </Link>
        )}
        <Link to={`/article/${article.slug}`}>
          <h2 className="font-serif font-bold text-2xl text-white mb-2 leading-tight group-hover:text-accent-300 transition-colors line-clamp-3">
            {article.title}
          </h2>
        </Link>
        {article.excerpt && (
          <p className="text-sm text-white/80 line-clamp-2 mb-4">{article.excerpt}</p>
        )}
        <div className="flex items-center justify-between">
          <AuthorChip author={article.author} date={article.published_at} light />
          <div className="flex items-center gap-3 text-white/70">
            <StatChip icon={<Eye className="w-3.5 h-3.5" />} value={formatNumber(article.views_count)} light />
            <StatChip icon={<Heart className="w-3.5 h-3.5" />} value={formatNumber(article.likes_count)} light />
          </div>
        </div>
      </div>
    </article>
  )
}

function HorizontalCard({ article, className }: { article: Article; className?: string }) {
  return (
    <article className={cn('card-hover flex gap-4 p-4 group', className)}>
      {article.cover_image && (
        <Link to={`/article/${article.slug}`} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden">
          <img
            src={article.cover_image}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        {article.category && (
          <span className="badge badge-primary mb-1.5">{article.category.name}</span>
        )}
        <Link to={`/article/${article.slug}`}>
          <h3 className="font-serif font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug mb-1">
            {article.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>{article.author?.full_name || article.author?.username}</span>
          <span>·</span>
          <StatChip icon={<Clock className="w-3 h-3" />} value={`${article.reading_time}m`} small />
          <StatChip icon={<Heart className="w-3 h-3" />} value={formatNumber(article.likes_count)} small />
        </div>
      </div>
    </article>
  )
}

function CompactCard({ article, className }: { article: Article; className?: string }) {
  return (
    <article className={cn('flex items-start gap-3 group', className)}>
      <Link to={`/article/${article.slug}`} className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm leading-snug line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {article.author?.full_name} · {article.reading_time}m read
        </p>
      </Link>
      {article.cover_image && (
        <Link to={`/article/${article.slug}`} className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden">
          <img src={article.cover_image} alt={article.title} loading="lazy" className="w-full h-full object-cover" />
        </Link>
      )}
    </article>
  )
}

function AuthorChip({
  author, date, light,
}: {
  author?: Article['author']
  date?: string | null
  light?: boolean
}) {
  if (!author) return null
  const textClass = light ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
  const subClass  = light ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
  return (
    <Link to={`/profile/${author.username}`} className="flex items-center gap-2 group/author">
      {author.avatar_url ? (
        <img src={author.avatar_url} alt={author.username} className="w-6 h-6 rounded-full object-cover" />
      ) : (
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-2xs font-bold', getAvatarColor(author.username))}>
          {getAvatarFallback(author.full_name || author.username)}
        </div>
      )}
      <div>
        <p className={cn('text-xs font-medium leading-none', textClass)}>
          {author.full_name || author.username}
        </p>
        {date && <p className={cn('text-xs leading-none mt-0.5', subClass)}>{formatRelativeDate(date)}</p>}
      </div>
    </Link>
  )
}

function StatChip({ icon, value, light, small }: { icon: React.ReactNode; value: string; light?: boolean; small?: boolean }) {
  return (
    <span className={cn(
      'flex items-center gap-1',
      small ? 'text-2xs' : 'text-xs',
      light ? 'text-white/60' : 'text-gray-400 dark:text-gray-500',
    )}>
      {icon} {value}
    </span>
  )
}
