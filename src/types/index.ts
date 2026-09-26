// ─── Core Database Types ──────────────────────────────────────

export type UserRole = 'user' | 'contributor' | 'moderator' | 'admin'
export type ArticleStatus = 'draft' | 'published' | 'archived' | 'under_review'
export type ReactionType = 'like' | 'love' | 'insightful' | 'applause'
export type NotificationType =
  | 'new_follower'
  | 'article_like'
  | 'article_comment'
  | 'comment_reply'
  | 'comment_like'
  | 'new_article'
  | 'mention'
  | 'achievement'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  country: string | null
  website: string | null
  languages: string[]
  role: UserRole
  is_verified: boolean
  followers_count: number
  following_count: number
  articles_count: number
  total_views: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  parent_id: string | null
  articles_count: number
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  articles_count: number
  created_at: string
}

export interface Article {
  id: string
  author_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  status: ArticleStatus
  category_id: string | null
  reading_time: number
  views_count: number
  likes_count: number
  comments_count: number
  bookmarks_count: number
  is_featured: boolean
  references: string[]
  youtube_embed: string | null
  language: string
  country: string | null
  time_period: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  // Joined
  author?: Profile
  category?: Category
  tags?: Tag[]
  is_liked?: boolean
  is_bookmarked?: boolean
}

export interface Comment {
  id: string
  article_id: string
  author_id: string
  parent_id: string | null
  content: string
  likes_count: number
  is_edited: boolean
  created_at: string
  updated_at: string
  // Joined
  author?: Profile
  replies?: Comment[]
  is_liked?: boolean
}

export interface Collection {
  id: string
  owner_id: string
  title: string
  slug: string
  description: string | null
  cover_image: string | null
  is_public: boolean
  is_featured: boolean
  articles_count: number
  category_id: string | null
  created_at: string
  updated_at: string
  // Joined
  owner?: Profile
  category?: Category
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
  // Joined
  actor?: Profile
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  badge_color: string
  criteria: Record<string, unknown>
  created_at: string
}

export interface ReadingHistory {
  id: string
  user_id: string
  article_id: string
  read_at: string
  read_duration: number
  // Joined
  article?: Article
}

export interface Report {
  id: string
  reporter_id: string
  content_type: 'article' | 'comment' | 'profile'
  content_id: string
  reason: string
  description: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
}

// ─── UI / Utility Types ───────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SearchFilters {
  query?: string
  category?: string
  country?: string
  language?: string
  timePeriod?: string
  author?: string
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_viewed' | 'trending'
  page?: number
  pageSize?: number
}

export interface SiteStats {
  articles: number
  contributors: number
  countries: number
  languages: number
  collections: number
  readers: number
}

export interface AIQuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}
