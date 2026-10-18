import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flag, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { HoneypotField, useBotProtection } from '@/components/security/BotProtection'

export type ReportContentType = 'article' | 'record' | 'collection' | 'profile'

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'factual_error', label: 'Factual error' },
  { value: 'missing_source', label: 'Missing or wrong source' },
  { value: 'copyright', label: 'Copyright or licensing problem' },
  { value: 'off_topic', label: 'Not related to African knowledge' },
  { value: 'offensive', label: 'Offensive or disrespectful' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Something else' },
]

interface Props {
  contentType: ReportContentType
  contentId: string
  contentTitle: string
  className?: string
}

export default function ReportButton({ contentType, contentId, contentTitle, className }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('factual_error')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const botProtection = useBotProtection()

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const trigger = triggerRef.current
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      trigger?.focus()
    }
  }, [open])

  const start = () => {
    if (!user) {
      toast('Sign in to report a problem')
      navigate('/auth/login', { state: { from: location.pathname } })
      return
    }
    botProtection.restart()
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const botReason = botProtection.blockedReason()
    if (botReason) { toast.error(botReason); return }
    if (reason === 'other' && description.trim().length < 10) {
      toast.error('Please describe the problem.')
      return
    }
    setSending(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      content_title: contentTitle.slice(0, 300),
      reason,
      description: description.trim().slice(0, 2000) || null,
    })
    setSending(false)
    if (error) {
      toast.error(error.message.includes('Too many') ? 'You’ve sent several reports recently. Please try again later.' : 'Could not send your report. Please try again.')
      return
    }
    toast.success('Thank you. A moderator will review it.')
    setOpen(false)
    setDescription('')
    setReason('factual_error')
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={start}
        className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors', className)}
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Report an error
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="report-title"
            className="card w-full max-w-md p-6 bg-white dark:bg-dark-surface relative outline-none">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 id="report-title" className="heading-sm text-lg text-gray-900 dark:text-white mb-1">Report a problem</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 line-clamp-2">{contentTitle}</p>

            <form onSubmit={submit} className="relative space-y-4">
              <HoneypotField value={botProtection.honeypot} onChange={botProtection.setHoneypot} />
              <fieldset>
                <legend className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">What’s wrong?</legend>
                <div className="space-y-1.5">
                  {REASONS.map(r => (
                    <label key={r.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                      <input type="radio" name="report-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="text-primary-600 focus:ring-primary-500" />
                      {r.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="report-details" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Details</label>
                <textarea id="report-details" rows={4} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What should be corrected? A source that supports the correction helps a lot."
                  className="input text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={sending} className="btn btn-primary btn-sm gap-1.5">
                  {sending && <Loader2 className="w-4 h-4 animate-spin" />} Send report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
