'use client'

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ArtifactViewer3DProps {
  imageSrc: string
  title: string
  className?: string
}

interface TiltState {
  rotateX: number // degrees  (vertical tilt)
  rotateY: number // degrees  (horizontal tilt)
}

interface SpotlightPos {
  x: number // 0‑100 %
  y: number // 0‑100 %
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_TILT = 20 // max degrees of rotation
const HOVER_SCALE = 1.05
const FLOAT_AMPLITUDE = 4 // degrees for idle float
const FLOAT_PERIOD = 6000 // ms per cycle
const RESET_DURATION = 500 // ms to ease back to neutral

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Map a pointer position (relative to the container) to tilt angles. */
function pointerToTilt(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { tilt: TiltState; spot: SpotlightPos } {
  const x = clientX - rect.left
  const y = clientY - rect.top
  const hw = rect.width / 2
  const hh = rect.height / 2

  // Normalise to ‑1 … +1
  const nx = (x - hw) / hw
  const ny = (y - hh) / hh

  return {
    tilt: {
      rotateX: -ny * MAX_TILT, // tilt away from cursor vertically
      rotateY: nx * MAX_TILT, // tilt toward cursor horizontally
    },
    spot: {
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ArtifactViewer3D: React.FC<ArtifactViewer3DProps> = ({
  imageSrc,
  title,
  className = '',
}) => {
  /* ---- state ---------------------------------------------------- */
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0 })
  const [spot, setSpot] = useState<SpotlightPos>({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const [isKeyboardTilting, setIsKeyboardTilting] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  /* ---- refs ----------------------------------------------------- */
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const floatRafRef = useRef<number | null>(null)

  /* ---- interaction flag ----------------------------------------- */
  const interacting = isHovering || isTouching || isKeyboardTilting

  /* ---- pointer handlers ----------------------------------------- */
  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        const rect = containerRef.current!.getBoundingClientRect()
        const { tilt: t, spot: s } = pointerToTilt(clientX, clientY, rect)
        setTilt(t)
        setSpot(s)
        rafRef.current = null
      })
    },
    [],
  )

  const onMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      handlePointerMove(e.clientX, e.clientY)
    },
    [handlePointerMove],
  )

  const onTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 0) return
      const t = e.touches[0]
      handlePointerMove(t.clientX, t.clientY)
    },
    [handlePointerMove],
  )

  const onMouseEnter = useCallback(() => setIsHovering(true), [])
  const onMouseLeave = useCallback(() => {
    setIsHovering(false)
    setTilt({ rotateX: 0, rotateY: 0 })
    setSpot({ x: 50, y: 50 })
  }, [])

  const onTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      setIsTouching(true)
      if (e.touches.length > 0) {
        const t = e.touches[0]
        handlePointerMove(t.clientX, t.clientY)
      }
    },
    [handlePointerMove],
  )

  const onTouchEnd = useCallback(() => {
    setIsTouching(false)
    setTilt({ rotateX: 0, rotateY: 0 })
    setSpot({ x: 50, y: 50 })
  }, [])

  /* ---- double‑click / double‑tap reset -------------------------- */
  const handleReset = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 })
    setSpot({ x: 50, y: 50 })
    setIsHovering(false)
    setIsTouching(false)
    setIsKeyboardTilting(false)
  }, [])

  /* ---- keyboard tilt -------------------------------------------- */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = 4
      const clamp = (v: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v))
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dy = -step
      else if (e.key === 'ArrowRight') dy = step
      else if (e.key === 'ArrowUp') dx = step
      else if (e.key === 'ArrowDown') dx = -step
      else if (e.key === 'Home' || e.key === '0') {
        e.preventDefault()
        handleReset()
        return
      } else return

      e.preventDefault()
      // Start from neutral rather than the idle-float angle on the first key press
      const base = isKeyboardTilting ? tilt : { rotateX: 0, rotateY: 0 }
      const next = { rotateX: clamp(base.rotateX + dx), rotateY: clamp(base.rotateY + dy) }
      setIsKeyboardTilting(true)
      setTilt(next)
      setSpot({ x: 50 + (next.rotateY / MAX_TILT) * 30, y: 50 - (next.rotateX / MAX_TILT) * 30 })
    },
    [handleReset, isKeyboardTilting, tilt],
  )

  /* ---- idle float animation ------------------------------------- */
  useEffect(() => {
    if (interacting) {
      if (floatRafRef.current !== null) {
        cancelAnimationFrame(floatRafRef.current)
        floatRafRef.current = null
      }
      return
    }

    let start: number | null = null

    const animate = (ts: number) => {
      if (start === null) start = ts
      const elapsed = ts - start
      const phase = (elapsed % FLOAT_PERIOD) / FLOAT_PERIOD
      const angle = Math.sin(phase * Math.PI * 2) * FLOAT_AMPLITUDE

      setTilt({ rotateX: angle * 0.3, rotateY: angle })
      floatRafRef.current = requestAnimationFrame(animate)
    }

    floatRafRef.current = requestAnimationFrame(animate)

    return () => {
      if (floatRafRef.current !== null) {
        cancelAnimationFrame(floatRafRef.current)
      }
    }
  }, [interacting])

  /* ---- cleanup -------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (floatRafRef.current !== null) cancelAnimationFrame(floatRafRef.current)
    }
  }, [])

  /* ---- computed styles ------------------------------------------ */
  const cardTransform = [
    `perspective(1000px)`,
    `rotateX(${tilt.rotateX}deg)`,
    `rotateY(${tilt.rotateY}deg)`,
    `scale(${interacting ? HOVER_SCALE : 1})`,
  ].join(' ')

  const spotlightBg = `radial-gradient(
    circle at ${spot.x}% ${spot.y}%,
    rgba(205, 164, 100, 0.25) 0%,
    rgba(205, 164, 100, 0.08) 35%,
    transparent 70%
  )`

  const sheenBg = `linear-gradient(
    ${135 + tilt.rotateY}deg,
    rgba(255, 255, 255, 0.0) 0%,
    rgba(255, 255, 255, 0.06) 40%,
    rgba(255, 255, 255, 0.14) 50%,
    rgba(255, 255, 255, 0.06) 60%,
    rgba(255, 255, 255, 0.0) 100%
  )`

  /* ---- render --------------------------------------------------- */
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* ─── Scene wrapper (perspective origin) ─── */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="img"
        aria-label={`${title}. Use the arrow keys to tilt the image and Home to reset.`}
        className="relative rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          width: '100%',
          maxWidth: '480px',
        }}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={handleReset}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (isKeyboardTilting) handleReset()
        }}
      >
        {/* ─── 3‑D Tilting card ─── */}
        <div
          className="relative w-full"
          style={{
            transform: cardTransform,
            transition: interacting
              ? 'transform 0.08s ease-out'
              : `transform ${RESET_DURATION}ms cubic-bezier(.25,.46,.45,.94)`,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* ── Outer frame / border ── */}
          <div
            className="relative overflow-hidden rounded-xl border border-white/10 bg-dark-bg"
            style={{
              boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
            }}
          >
            {/* ── Image ── */}
            {imageFailed && (
              <div
                className="flex items-center justify-center text-sm text-ivory-400 bg-dark-bg"
                style={{ minHeight: '280px' }}
              >
                Image could not be loaded
              </div>
            )}
            <img
              src={imageSrc}
              alt=""
              referrerPolicy="no-referrer"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageFailed(true)
                setImageLoaded(true)
              }}
              className={imageFailed ? 'hidden' : 'block w-full h-auto'}
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.6s ease',
                minHeight: '280px',
                objectFit: 'cover',
              }}
            />

            {/* ── Loading placeholder ── */}
            {!imageLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-dark-bg"
              >
                <div className="w-8 h-8 rounded-full border-2 border-accent-400/25 border-t-accent-400 animate-spin" />
              </div>
            )}

            {/* ── Museum spotlight overlay ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: spotlightBg,
                mixBlendMode: 'screen',
                opacity: interacting ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            />

            {/* ── Glass sheen overlay ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: sheenBg,
                mixBlendMode: 'overlay',
                opacity: interacting ? 1 : 0.3,
                transition: 'opacity 0.5s ease',
              }}
            />

            {/* ── Edge vignette ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Title plaque ─── */}
      <div className="mt-4 px-5 py-2.5 text-center rounded-xl border border-white/10 bg-dark-surface" style={{ maxWidth: '420px' }}>
        <h3 className="eyebrow m-0">
          Artifact
        </h3>
        <p className="mt-1 font-serif font-bold text-lg text-white leading-snug">
          {title}
        </p>
      </div>

      {/* ─── Interaction hint ─── */}
      <p
        className="mt-3 text-xs text-ivory-500"
        style={{
          transition: 'opacity 0.4s ease',
          opacity: interacting ? 0 : 1,
        }}
      >
        Move the pointer or use arrow keys to tilt · double‑click to reset
      </p>
    </div>
  )
}

export default ArtifactViewer3D
