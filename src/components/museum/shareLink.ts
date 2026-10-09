import toast from 'react-hot-toast'

export async function shareLink(url: string, title: string) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url })
      return
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  } catch {
    toast.error('Could not copy the link. You can copy it from here: ' + url)
  }
}
