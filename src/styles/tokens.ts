/**
 * AFROARCHIVE Design Tokens System
 * Premium digital museum & interactive exhibition tokens.
 * PRESERVE. DISCOVER. EMPOWER.
 */

export const tokens = {
  colors: {
    // Canvas & Surfaces (Deep Charcoal / Obsidian & Warm Neutral)
    charcoal: {
      950: '#070708', // Deepest background atmosphere
      900: '#0C0C0E', // Primary museum canvas background
      850: '#131316', // Primary surface layer
      800: '#1B1B20', // Card / Floating container surface
      700: '#26262D', // Subtle container outline / border
      600: '#383842', // Muted stroke
      500: '#525261', // Deemphasized text / metadata
    },
    ivory: {
      50: '#FDFBF7',  // Highlight / pure warm white
      100: '#F5F2EB', // Primary light text & warm parchment canvas
      200: '#EBE5D8', // Secondary parchment
      300: '#DED5C3', // Muted paper text
      400: '#C5BAA5', // Subdued metadata label
      500: '#9C907A', // Aged document shadow
    },
    // Bronze & Ochre Accents (Restrained & Regnant)
    bronze: {
      300: '#E4B856',
      400: '#D4A034', // Primary museum gold/bronze accent
      500: '#B8860B', // Ochre accent
      600: '#916706', // Deep bronze border / highlight
      700: '#694A02', // Shadow accent
      900: '#332300', // Subtle tint background
    },
    // Earth & Soil Tones
    earth: {
      900: '#1C1815',
      800: '#2A241F',
      700: '#3D352E',
      600: '#594F45',
      400: '#8A7C6E',
    },
    // Deep Burgundy (Used sparingly for archival seals / markers)
    burgundy: {
      900: '#3B0F0F',
      700: '#6B1D1D',
      500: '#A32E2E',
    },
    // Desaturated Savanna Green
    savanna: {
      900: '#151D18',
      800: '#223329',
      600: '#3A5243',
    },
  },

  typography: {
    fontFamily: {
      display: ['Cinzel', 'serif'],
      serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      'metadata': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.25em' }], // 11px
      'caption': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.12em' }], // 13px
      'body-sm': ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }], // 15px
      'body': ['1.0625rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }], // 17px
      'h5': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.02em' }], // 20px
      'h4': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.02em' }], // 24px
      'h3': ['2rem', { lineHeight: '2.5rem', letterSpacing: '0.01em' }], // 32px
      'h2': ['2.75rem', { lineHeight: '3.25rem', letterSpacing: '-0.01em' }], // 44px
      'h1': ['3.75rem', { lineHeight: '4.25rem', letterSpacing: '-0.02em' }], // 60px
      'display-lg': ['clamp(2.75rem, 6vw, 6.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      'display-hero': ['clamp(3rem, 7.5vw, 8rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  layout: {
    maxWidth: '1440px',
    contentPaddingMobile: '1.25rem', // 20px
    contentPaddingTablet: '2.5rem',  // 40px
    contentPaddingDesktop: '4rem',  // 64px
    headerHeight: '5.25rem',        // 84px
  },

  motion: {
    easings: {
      exhibition: [0.16, 1, 0.3, 1],
      cinematic: [0.25, 1, 0.5, 1],
      sharp: [0.4, 0, 0.2, 1],
    },
    durations: {
      instant: 0.15,
      fast: 0.3,
      normal: 0.6,
      cinematic: 1.2,
      epic: 2.0,
    },
    staggerDelay: 0.12,
  },

  borders: {
    subtle: '1px solid rgba(236, 231, 220, 0.08)',
    accent: '1px solid rgba(212, 160, 52, 0.3)',
    dark: '1px solid rgba(12, 12, 14, 0.5)',
  },
} as const

export type DesignTokens = typeof tokens
