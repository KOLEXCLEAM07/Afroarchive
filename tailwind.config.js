/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Digital Museum Palette (Charcoal, Ivory, Bronze, Earth, Burgundy, Savanna)
        charcoal: { 950: '#070708', 900: '#0C0C0E', 850: '#131316', 800: '#1B1B20', 700: '#26262D', 600: '#383842', 500: '#525261' },
        ivory: { 50: '#FDFBF7', 100: '#F5F2EB', 200: '#EBE5D8', 300: '#DED5C3', 400: '#C5BAA5', 500: '#9C907A', 600: '#7A6E5E', 700: '#5C5247' },
        bronze: { 300: '#E4B856', 400: '#D4A034', 500: '#B8860B', 600: '#916706', 700: '#694A02', 800: '#4A3301', 900: '#332300' },
        earth: { 900: '#1C1815', 800: '#2A241F', 700: '#3D352E', 600: '#594F45', 500: '#6E6054', 400: '#8A7C6E' },
        burgundy: { 900: '#3B0F0F', 700: '#6B1D1D', 500: '#A32E2E', 300: '#C96060' },
        savanna: { 900: '#151D18', 800: '#223329', 700: '#2E4538', 600: '#3A5243', 500: '#4A6654' },

        // Platform & Portal Color Extensions (Emerald, Gold, Sand, Dark surfaces)
        primary: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#0F5132',
          600: '#0B3E26',
          700: '#082E1C',
          800: '#051E12',
          900: '#020F09',
        },
        accent: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#B08A44',
          600: '#926F32',
          700: '#755624',
          800: '#583F18',
          900: '#3C2A0E',
        },
        sand: {
          50:  '#FAF8F5',
          100: '#F5F0E8',
          200: '#EAE1D0',
          300: '#DDD1B8',
          400: '#C8B896',
          500: '#B29F76',
        },
        dark: {
          bg:      '#070708',
          surface: '#0C0C0E',
          card:    '#131316',
          border:  '#26262D',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        serif:   ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: { widest: '0.25em', exotic: '0.4em' },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        metadata: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.25em' }],
        'display-lg': ['clamp(2.75rem, 6vw, 6.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-hero': ['clamp(2.5rem, 7vw, 7.5rem)', { lineHeight: '0.96', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        museum: '0 20px 50px rgba(0, 0, 0, 0.7)',
        artifact: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 160, 52, 0.08)',
        'bronze-glow': '0 0 30px rgba(212, 160, 52, 0.15)',
        'glow': '0 0 25px rgba(176, 138, 68, 0.25)',
        'inner-light': 'inset 0 1px 0 rgba(245, 242, 235, 0.08)',
      },
      backgroundImage: {
        'museum-vignette': 'radial-gradient(ellipse at center, rgba(19, 19, 22, 0.4) 0%, rgba(7, 7, 8, 0.95) 100%)',
        'parchment-glow': 'radial-gradient(circle at 60% 40%, rgba(212, 160, 52, 0.08) 0%, transparent 60%)',
      },
      backdropBlur: { xs: '2px' },
      inset: { '5%': '5%', '10%': '10%', '15%': '15%' },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeInScale: { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideInUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        floatSlow: { '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' }, '50%': { transform: 'translateY(-8px) rotate(0.5deg)' } },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'fade-in-scale': 'fadeInScale 0.4s ease-out both',
        'slide-in-right': 'slideInRight 0.35s ease-out both',
        'slide-in-up': 'slideInUp 0.4s ease-out both',
        'float-slow': 'floatSlow 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
