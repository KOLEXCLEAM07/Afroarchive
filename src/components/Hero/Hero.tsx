import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ArtifactVisual } from './ArtifactVisual'

export interface HeroProps {
  onExploreClick?: () => void
  onDiscoverClick?: () => void
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onDiscoverClick }) => {
  const shouldReduceMotion = useReducedMotion()

  // Staggered Motion Sequence Config (Museum Exhibition Entry)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.14,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 1.0,
        ease: [0.16, 1, 0.3, 1] as const, // Exhibition smooth easing
      },
    },
  }

  const artifactVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.94, y: shouldReduceMotion ? 0 : 35 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 1.4,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  return (
    <section
      id="hero"
      aria-label="Hero Opening Exhibition"
      className="relative min-h-screen w-full bg-charcoal-900 text-ivory-100 flex flex-col justify-between pt-24 md:pt-28 lg:pt-36 pb-12 overflow-hidden bg-archival-grid"
    >
      {/* Background Atmosphere Layers (1. Background gradually appears) */}
      <div 
        className="absolute inset-0 bg-museum-vignette pointer-events-none z-0" 
        aria-hidden="true" 
      />
      <div 
        className="absolute top-1/4 right-[5%] w-[500px] h-[500px] rounded-full bg-parchment-glow pointer-events-none z-0 blur-3xl opacity-60" 
        aria-hidden="true" 
      />
      
      {/* Large Historical Background Watermark / Numeral — extremely subtle */}
      <div 
        className="absolute top-16 right-8 lg:right-20 font-display font-bold select-none pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
        style={{ fontSize: 'clamp(8rem, 18vw, 22rem)', lineHeight: 1, opacity: 0.035, color: '#F5F2EB' }}
      >
        1380
      </div>

      <div className="relative z-10 container-app w-full my-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
        >
          {/* Left Column — Text & Editorial Hierarchy (Words, Headline, CTAs) */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 md:space-y-8 text-left">
            
            {/* Tagline & Metadata Labels (3. Wordmark / Tagline settled) */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
              <span className="badge badge-primary">
                A LIVING DIGITAL ARCHIVE
              </span>
              <span className="font-mono text-xs text-ivory-400 tracking-wide hidden sm:inline">
                Stories, objects, and ideas from across Africa
              </span>
            </motion.div>

            {/* Main Headline (4. Headline reveals progressively) */}
            <motion.h1
              variants={itemVariants}
              className="font-display font-semibold text-display-hero text-ivory-100 tracking-tight leading-[0.98]"
            >
              AFRICA’S KNOWLEDGE,{' '}
              <span className="block italic font-serif font-normal text-bronze-400">
                CARRIED FORWARD.
              </span>
            </motion.h1>

            {/* Supporting Copy (5. Supporting text fades/reveals) */}
            <motion.p
              variants={itemVariants}
              className="font-sans text-base md:text-lg text-ivory-300 font-light leading-relaxed max-w-2xl"
            >
              Begin with the people, places, texts, and traditions that continue to shape African life and thought. This is a growing collection, made for curious readers.
            </motion.p>

            {/* Key Exhibition Pillars Metadata Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 pt-2 pb-2 w-full max-w-lg border-y border-ivory-100/10">
              <div className="flex flex-col">
                <span className="font-mono text-2xs uppercase text-bronze-400 tracking-wider">OBJECTS</span>
                <span className="font-serif text-sm text-ivory-200">8 to explore</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-2xs uppercase text-bronze-400 tracking-wider">PERSPECTIVES</span>
                <span className="font-serif text-sm text-ivory-200">Across regions</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-2xs uppercase text-bronze-400 tracking-wider">FORMAT</span>
                <span className="font-serif text-sm text-ivory-200">Read, browse, connect</span>
              </div>
            </motion.div>

            {/* CTA Buttons (6. CTA buttons appear) */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={onExploreClick}
                className="w-full sm:w-auto"
              >
                BROWSE THE COLLECTION
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={onDiscoverClick}
                className="w-full sm:w-auto"
              >
                EXPLORE BY REGION
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="text-ivory-400 font-sans text-sm pt-1">
              <span>Start with a featured manuscript from Timbuktu, then follow the threads that interest you.</span>
            </motion.div>
          </div>

          {/* Right Column — Monumental Archival Visual Centerpiece (2. Artifact reveals & bleeds) */}
          <motion.div
            variants={artifactVariants}
            className="lg:col-span-5 relative w-full flex justify-center lg:justify-end"
          >
            <ArtifactVisual
              artifactTitle="Timbuktu Astronomical & Mathematical Folio"
              catalogNumber="CAT. TBT-MS-1384"
              originDate="c. 1380 CE (8th Century AH)"
              originLocation="Sankoré University Archives, Timbuktu, Mali"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Footer Row & Scroll Indicator (8. Scroll indicator appears) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 1.6, duration: 0.8 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full pt-8 flex items-end justify-between border-t border-ivory-100/10"
      >
        <div className="flex items-center space-x-3 text-ivory-400">
          <BookOpen className="w-4 h-4 text-bronze-400" />
          <span className="font-mono text-2xs uppercase tracking-widest">
            FEATURED COLLECTION
          </span>
        </div>

        {/* Scroll Indicator */}
        <a
          href="#explore"
          aria-label="Scroll to Explore section"
          className="group flex flex-col items-center space-y-2 text-ivory-400 hover:text-bronze-300 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-bronze-400 p-1"
        >
          <span className="font-mono text-[10px] uppercase tracking-exotic">
            START EXPLORING
          </span>
          <div className="w-6 h-10 rounded-full border border-ivory-100/20 group-hover:border-bronze-400/60 flex items-center justify-center p-1">
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-1.5 h-2 bg-bronze-400 rounded-full"
            />
          </div>
        </a>

        <div className="hidden sm:flex items-center space-x-2 text-ivory-400 font-mono text-2xs tracking-widest uppercase">
          <span>TIMBUKTU · GREAT ZIMBABWE · BENIN · AKSUM</span>
        </div>
      </motion.div>
    </section>
  )
}
