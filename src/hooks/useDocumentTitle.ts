import { useEffect } from 'react'

const SITE_NAME = 'AfroArchive'

export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Preserve. Discover. Empower.`
    return () => { document.title = previous }
  }, [title])
}
