import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {})

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://gjtddtnonvyvvrwbscaq.supabase.co'
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGRkdG5vbnZ5dnZyd2JzY2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTMyNTgsImV4cCI6MjA5ODMyOTI1OH0.CH7qVk1A2wsg3sjXTynKaqqPt-uRSa1t-d65YleUH0w'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
  },
})

// ─── Storage helpers ──────────────────────────────────────────

export const STORAGE_BUCKETS = {
  AVATARS:    'avatars',
  ARTICLES:   'article-images',
  COVERS:     'collection-covers',
} as const

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { contentType?: string; upsert?: boolean }
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType || file.type,
    upsert:      options?.upsert ?? true,
  })
  if (error) throw error
  return getPublicUrl(bucket, path)
}
