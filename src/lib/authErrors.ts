// Maps Supabase auth errors to messages suitable for visitors.
// Configuration problems are logged for developers instead of shown to users.

export function friendlyAuthError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  const msg = raw.toLowerCase()

  if (msg.includes('invalid login credentials')) return 'That email and password don’t match. Please try again.'
  if (msg.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link we sent.'
  if (msg.includes('user already registered') || msg.includes('already been registered')) return 'An account with this email already exists. Try signing in instead.'
  if (msg.includes('duplicate key') && msg.includes('username')) return 'That username is already taken.'
  if (msg.includes('password should be') || msg.includes('weak password')) return 'Please choose a stronger password (at least 8 characters).'
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('for security purposes')) return 'Too many attempts. Please wait a minute and try again.'
  if (msg.includes('unable to validate email') || msg.includes('invalid email')) return 'Please enter a valid email address.'
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'We couldn’t reach the server. Check your connection and try again.'

  if (msg.includes('provider is not enabled') || msg.includes('not enabled') || msg.includes('validation_failed') || msg.includes('confirmation email')) {
    console.error('[auth] configuration issue:', raw)
    return 'This sign-in method is temporarily unavailable. Please use another option or try again later.'
  }

  if (raw) console.error('[auth]', raw)
  return fallback
}
