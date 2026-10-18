import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const MIN_HUMAN_TIME_MS = 1_800

/** A low-friction client signal. Database limits remain the authoritative protection. */
export function useBotProtection() {
  const startedAt = useRef(Date.now())
  const [honeypot, setHoneypot] = useState('')

  const restart = useCallback(() => {
    startedAt.current = Date.now()
    setHoneypot('')
  }, [])

  const blockedReason = useCallback(() => {
    if (honeypot.trim()) return 'Unable to submit this form.'
    if (Date.now() - startedAt.current < MIN_HUMAN_TIME_MS) return 'Please take a moment to complete the form before submitting.'
    return null
  }, [honeypot])

  return { honeypot, setHoneypot, restart, blockedReason }
}

export function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
      <label htmlFor="website-url">Leave this field empty</label>
      <input id="website-url" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={event => onChange(event.target.value)} />
    </div>
  )
}

interface TurnstileProps {
  onToken: (token: string | null) => void
  /** Reset after an authentication request: Turnstile tokens can only be used once. */
  resetKey?: number
  action: 'login' | 'signup' | 'password_reset'
}

/** Renders only after VITE_TURNSTILE_SITE_KEY is configured. The secret stays in Supabase. */
export function Turnstile({ onToken, resetKey = 0, action }: TurnstileProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
  const targetRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey || !targetRef.current) return
    let disposed = false

    const render = () => {
      if (disposed || !targetRef.current || !window.turnstile || widgetRef.current) return
      widgetRef.current = window.turnstile.render(targetRef.current, {
        sitekey: siteKey,
        theme: 'auto',
        action,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      })
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-afroarchive-turnstile]')
    if (existing) {
      if (window.turnstile) render()
      else existing.addEventListener('load', render, { once: true })
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.afroarchiveTurnstile = 'true'
      script.addEventListener('load', render, { once: true })
      document.head.appendChild(script)
    }

    return () => {
      disposed = true
      if (widgetRef.current && window.turnstile) window.turnstile.remove(widgetRef.current)
      widgetRef.current = null
    }
  }, [siteKey, onToken])

  useEffect(() => {
    if (!widgetRef.current || !window.turnstile) return
    window.turnstile.reset(widgetRef.current)
    onToken(null)
  }, [resetKey, onToken])

  if (!siteKey) return null
  return <div ref={targetRef} className="min-h-[65px]" aria-label="Bot protection" />
}

export function captchaRequired(token: string | null): boolean {
  return Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && !token
}
