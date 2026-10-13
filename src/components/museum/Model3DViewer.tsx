import { useMemo, useState } from 'react'
import { Box, ExternalLink, Move3d } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Model3D {
  /** Sketchfab embed URL, e.g. https://sketchfab.com/models/<id>/embed */
  embedUrl: string
  /** Preview image shown until the visitor chooses to load the model. */
  poster?: string | null
  /** Link to the model's own page, for credit. */
  viewerUrl?: string | null
}

const EMBED_PATTERN = /^https:\/\/sketchfab\.com\/models\/[a-f0-9]{32}\/embed$/i

/** Only Sketchfab embeds are ever placed in an iframe, no matter what the database contains. */
export function safeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const clean = url.split('?')[0]
  return EMBED_PATTERN.test(clean) ? clean : null
}

interface Props {
  model: Model3D
  title: string
  credit?: string | null
  className?: string
}

export default function Model3DViewer({ model, title, credit, className }: Props) {
  const [active, setActive] = useState(false)
  const base = safeEmbedUrl(model.embedUrl)

  const src = useMemo(() => {
    if (!base) return null
    const params = new URLSearchParams({
      autostart: '1',
      ui_theme: 'dark',
      ui_infos: '0',
      ui_hint: '1',
      dnt: '1',
    })
    return `${base}?${params.toString()}`
  }, [base])

  if (!base || !src) return null

  return (
    <figure className={cn('shrink-0', className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-dark-card">
        {active ? (
          <iframe
            title={`3D model: ${title}`}
            src={src}
            loading="lazy"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            aria-label={`View ${title} in 3D`}
            className="group absolute inset-0 flex h-full w-full items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            {model.poster ? (
              <img src={model.poster} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <Box className="h-16 w-16 text-white/20" aria-hidden="true" />
            )}
            <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20" aria-hidden="true" />
            <span className={cn('relative inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-charcoal-950 shadow-lg transition-transform group-hover:scale-105')}>
              <Move3d className="h-4 w-4" aria-hidden="true" /> View in 3D
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-ivory-400">
        <span>
          {active ? 'Drag to rotate, scroll or pinch to zoom.' : 'Turn the object all the way round.'}
          {credit && <> {credit}</>}
        </span>
        {model.viewerUrl && (
          <a href={model.viewerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-300 hover:underline">
            Open on Sketchfab <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </figcaption>
    </figure>
  )
}
