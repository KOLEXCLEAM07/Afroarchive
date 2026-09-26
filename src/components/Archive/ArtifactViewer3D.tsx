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
  const [imageLoaded, setImageLoaded] = useState(false)

  /* ---- refs ----------------------------------------------------- */
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const floatRafRef = useRef<number | null>(null)

  /* ---- interaction flag ----------------------------------------- */
  const interacting = isHovering || isTouching

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
  }, [])

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
    <div
      className={`flex flex-col items-center select-none ${className}`}
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* ─── Scene wrapper (perspective origin) ─── */}
      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing"
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
            className="relative overflow-hidden rounded-lg"
            style={{
              border: '3px solid rgba(205, 164, 100, 0.35)',
              boxShadow: [
                '0 4px 6px rgba(0,0,0,0.4)',
                '0 20px 50px rgba(0,0,0,0.55)',
                `inset 0 0 60px rgba(0,0,0,0.3)`,
                `0 0 80px rgba(205, 164, 100, ${interacting ? 0.15 : 0.06})`,
              ].join(', '),
              background: '#1a1714',
            }}
          >
            {/* ── Image ── */}
            <img
              src={imageSrc}
              alt={title}
              referrerPolicy="no-referrer"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.warn('Artifact 3D viewer image load failed:', imageSrc)
                // Fallback to placeholder if image fails to load
                setImageLoaded(true)
              }}
              className="block w-full h-auto"
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.6s ease',
                minHeight: '280px',
                objectFit: 'cover',
                background: '#161412',
              }}
            />

            {/* ── Loading placeholder ── */}
            {!imageLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: '#161412' }}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: 'rgba(205,164,100,0.3)',
                    borderTopColor: 'rgba(205,164,100,0.8)',
                  }}
                />
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
                  'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Museum pedestal ─── */}
      <div className="flex flex-col items-center w-full" style={{ maxWidth: '480px' }}>
        {/* Pedestal neck */}
        <div
          style={{
            width: '60%',
            height: '8px',
            background: 'linear-gradient(to bottom, #2a2520, #1e1b17)',
            borderRadius: '0 0 2px 2px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
        {/* Pedestal base */}
        <div
          style={{
            width: '75%',
            height: '6px',
            background: 'linear-gradient(to bottom, #242019, #161412)',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        />
        {/* Pedestal shadow on "floor" */}
        <div
          style={{
            width: '85%',
            height: '18px',
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, transparent 70%)',
            marginTop: '-2px',
          }}
        />
      </div>

      {/* ─── Title plaque ─── */}
      <div
        className="mt-3 px-6 py-2 text-center rounded"
        style={{
          background: 'linear-gradient(135deg, rgba(42,37,32,0.8), rgba(30,27,23,0.9))',
          border: '1px solid rgba(205, 164, 100, 0.2)',
          maxWidth: '420px',
        }}
      >
        <h3
          className="text-sm tracking-widest uppercase"
          style={{
            color: 'rgba(205, 164, 100, 0.7)',
            letterSpacing: '0.15em',
            margin: 0,
            fontWeight: 400,
          }}
        >
          artifact
        </h3>
        <p
          className="mt-1 text-base font-medium leading-snug"
          style={{
            color: '#f5f0e8',
            margin: '4px 0 0',
          }}
        >
          {title}
        </p>
      </div>

      {/* ─── Interaction hint ─── */}
      <p
        className="mt-3 text-xs tracking-wide"
        style={{
          color: 'rgba(205, 164, 100, 0.35)',
          transition: 'opacity 0.4s ease',
          opacity: interacting ? 0 : 1,
        }}
      >
        drag to rotate · double‑click to reset
      </p>
    </div>
  )
}

export default ArtifactViewer3D
