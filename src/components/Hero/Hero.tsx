import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { Button } from '../ui/Button'
import { ArtifactVisual } from './ArtifactVisual'
import { ARTIFACTS_DATA } from '../../data/archiveData'

export interface HeroProps {
  onExploreClick?: () => void
  onRegionClick?: () => void
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onRegionClick }) => {
  const shouldReduceMotion = useReducedMotion()

  // Staggered Motion Sequence Config (Museum Exhibition Entry)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.8,
        ease: [0.16, 1, 0.3, 1] as const, // Exhibition smooth easing
      },
    },
  }

  const artifactVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 1.1,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  return (
    <section
      id="hero"
      aria-label="Hero Opening Exhibition"
      className="relative min-h-[calc(100vh-8rem)] w-full bg-dark-bg text-ivory-100 flex flex-col justify-between pt-10 lg:pt-16 pb-10 overflow-hidden"
    >
      {/* Background Atmosphere Layer */}
      <div
        className="absolute inset-0 bg-museum-vignette pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 container-app w-full my-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
        >
          {/* Left Column — Text & Editorial Hierarchy (Words, Headline, CTAs) */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 md:space-y-7 text-left">

            {/* Tagline & Metadata Labels */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Virtual museum</span>
              <span className="text-sm text-ivory-400 hidden sm:inline">
                Stories, objects, and ideas from across Africa
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="heading-hero text-white"
            >
              Africa’s knowledge,{' '}
              <span className="block italic font-normal text-accent-300">
                carried forward.
              </span>
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              variants={itemVariants}
              className="text-base md:text-lg text-ivory-300 leading-relaxed max-w-2xl"
            >
              Begin with the people, places, texts, and traditions that continue to shape African life and thought. This is a growing collection, made for curious readers.
            </motion.p>

            {/* Key Exhibition Pillars Metadata Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 py-4 w-full max-w-lg border-y border-white/10">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-accent-300">Objects</span>
                <span className="text-sm text-ivory-200">{ARTIFACTS_DATA.length} to explore</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-accent-300">Perspectives</span>
                <span className="text-sm text-ivory-200">Across regions</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-accent-300">Format</span>
                <span className="text-sm text-ivory-200">Read, browse, connect</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-1"
            >
              <Button
                variant="accent"
                size="lg"
                onClick={onExploreClick}
                withArrow
                className="w-full sm:w-auto"
              >
                Browse the collection
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onRegionClick}
                className="w-full sm:w-auto"
              >
                Explore by region
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="text-ivory-400 text-sm">
              <span>Start with a featured manuscript from Timbuktu, then follow the threads that interest you.</span>
            </motion.div>
          </div>

          {/* Right Column — Archival Visual Centerpiece */}
          <motion.div
            variants={artifactVariants}
            className="lg:col-span-5 relative w-full flex justify-center lg:justify-end"
          >
            <ArtifactVisual
              imageSrc="https://upload.wikimedia.org/wikipedia/commons/3/39/Timbuktu-manuscripts-astronomy-tables.jpg"
              artifactTitle="Astronomy tables"
              originLocation="Timbuktu manuscripts, Mali"
              credit="Timbuktu manuscript with astronomical tables. Public domain, via Wikimedia Commons"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Footer Row & Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 1.2, duration: 0.6 }}
        className="relative z-10 container-app w-full mt-10 pt-6 flex items-end justify-between border-t border-white/10"
      >
        <div className="flex items-center gap-2 text-ivory-400">
          <BookOpen className="w-4 h-4 text-accent-400" aria-hidden="true" />
          <span className="text-sm">Featured collection</span>
        </div>

        {/* Scroll Indicator */}
        <button
          type="button"
          onClick={onExploreClick}
          aria-label="Start exploring the collection"
          className="group flex flex-col items-center gap-2 text-ivory-400 hover:text-accent-300 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 p-1"
        >
          <span className="text-xs">Start exploring</span>
          <div className="w-6 h-10 rounded-full border border-white/20 group-hover:border-accent-400/60 flex items-center justify-center p-1">
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-1.5 h-2 bg-accent-400 rounded-full"
            />
          </div>
        </button>

        <div className="hidden sm:flex items-center text-ivory-400 text-sm">
          <span>Timbuktu · Great Zimbabwe · Benin · Aksum</span>
        </div>
      </motion.div>
    </section>
  )
}
