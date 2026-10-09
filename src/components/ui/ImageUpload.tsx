import { useId, useRef, useState } from 'react'
import { ImagePlus, Link2, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { STORAGE_BUCKETS, uploadFile } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type Bucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_INPUT_BYTES = 15 * 1024 * 1024

interface Props {
  label: string
  value: string
  onChange: (url: string) => void
  bucket: Bucket
  /** Longest side after resizing, in pixels. */
  maxDimension?: number
  previewClassName?: string
  hint?: string
}

/** Downscales large photos in the browser so uploads stay small and fast. */
async function resize(file: File, maxDimension: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) { bitmap.close(); return file }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.85))
  return blob ?? file
}

export default function ImageUpload({ label, value, onChange, bucket, maxDimension = 1600, previewClassName, hint }: Props) {
  const { user } = useAuth()
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [showUrl, setShowUrl] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file || !user) return
    if (!ACCEPTED.includes(file.type)) { toast.error('Please choose a JPEG, PNG or WebP image.'); return }
    if (file.size > MAX_INPUT_BYTES) { toast.error('That image is too large (max 15 MB).'); return }
    setBusy(true)
    try {
      const blob = await resize(file, maxDimension)
      const ext = blob.type === 'image/webp' ? 'webp' : file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const url = await uploadFile(bucket, path, new File([blob], `upload.${ext}`, { type: blob.type || file.type }), { upsert: false })
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      console.error('[upload]', err)
      toast.error('Upload failed. Please try again, or paste an image link instead.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">{label}</span>
      <div className="flex items-start gap-4">
        <div className={cn('flex-shrink-0 rounded-xl overflow-hidden border border-sand-200 dark:border-dark-border bg-sand-100 dark:bg-dark-card flex items-center justify-center', previewClassName ?? 'w-28 h-20')}>
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-6 h-6 text-gray-400" aria-hidden="true" />}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} id={inputId} type="file" accept={ACCEPTED.join(',')} className="sr-only" onChange={e => handleFile(e.target.files?.[0])} />
            <label htmlFor={inputId} className={cn('btn btn-outline btn-sm gap-1.5 cursor-pointer', busy && 'pointer-events-none opacity-60')}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            </label>
            <button type="button" onClick={() => setShowUrl(s => !s)} className="btn btn-ghost btn-sm gap-1.5" aria-expanded={showUrl}>
              <Link2 className="w-3.5 h-3.5" /> Use a link
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="btn btn-ghost btn-sm gap-1.5 text-red-600">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
          {showUrl && (
            <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder="https://…" aria-label={`${label} link`} className="input text-xs font-mono" />
          )}
          <p className="text-xs text-gray-400">{hint ?? 'JPEG, PNG or WebP. Only upload images you have the right to share.'}</p>
        </div>
      </div>
    </div>
  )
}
