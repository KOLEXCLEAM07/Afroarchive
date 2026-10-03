import React, { useState } from 'react'
import { MapPin, Globe, Compass, ArrowRight, Landmark, Layers, Sparkles, BookOpen } from 'lucide-react'
import { MAP_REGIONS, RegionProfile } from '../../data/mapData'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export interface AfricaMapSectionProps {
  onSelectRegionFilter?: (regionKey: string) => void
}

export const AfricaMapSection: React.FC<AfricaMapSectionProps> = ({ onSelectRegionFilter }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionProfile>(MAP_REGIONS[0])
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null)

  const handleExploreRegion = () => {
    if (onSelectRegionFilter) {
      onSelectRegionFilter(selectedRegion.regionKey)
    }
    const elem = document.getElementById('archive')
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      id="map"
      aria-label="Interactive Africa Map and Regional Discovery"
      className="section bg-white dark:bg-dark-surface border-t border-sand-200 dark:border-dark-border text-gray-900 dark:text-ivory-100 transition-colors overflow-hidden"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sand-200 dark:border-dark-border pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="badge badge-primary">CARTOGRAPHIC EXHIBITION</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Historical Regional Zones
              </span>
            </div>

            <h2 className="heading-xl text-gray-900 dark:text-white tracking-tight">
              Interactive Africa Map
            </h2>

            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              Explore the historical civilizational zones, trade routes, capital cities, and architectural traditions across Africa.
            </p>
          </div>

          <div className="badge badge-primary">
            SELECT REGIONAL ZONE
          </div>
        </div>

        {/* Map & Region Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column — Interactive Cartographic Vector Map */}
          <div className="lg:col-span-7 card p-6 md:p-8 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            {/* Map Header */}
            <div className="flex justify-between items-center text-ivory-400 font-mono text-2xs">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-bronze-400" />
                <span>AFRICAN HISTORICAL CARTOGRAPHY</span>
              </div>
              <span>SCALE: 1 : 10,000,000</span>
            </div>

            {/* Interactive SVG Map Vector Representation */}
            <div className="relative aspect-[4/3.8] w-full my-auto flex items-center justify-center bg-[#131316] rounded border border-ivory-100/5 p-4 overflow-hidden">
              
              {/* Subtle Grid Lines Overlay */}
              <div className="absolute inset-0 bg-archival-grid opacity-30 pointer-events-none" />

              {/* Africa Continent Outline Graphic */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-ivory-100/20 max-w-lg mx-auto"
                aria-label="Map of Africa showing regional zones"
              >
                {/* Simplified High-Impact African Continent Vector Silhouette Path */}
                <path
                  d="M 45 10 C 65 10, 80 20, 85 30 C 90 40, 85 55, 75 70 C 65 85, 55 95, 48 95 C 40 95, 30 80, 25 65 C 20 50, 15 35, 25 25 C 35 15, 38 10, 45 10 Z"
                  fill="none"
                  stroke="rgba(212, 160, 52, 0.25)"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                />

                {/* Regional Hotspot Nodes */}
                {MAP_REGIONS.map((region) => {
                  const isSelected = selectedRegion.id === region.id
                  const isHovered = hoveredRegionId === region.id
                  return (
                    <g
                      key={region.id}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${region.name}`}
                      onClick={() => setSelectedRegion(region)}
                      onPointerEnter={() => setHoveredRegionId(region.id)}
                      onPointerLeave={() => setHoveredRegionId(null)}
                      onFocus={() => setHoveredRegionId(region.id)}
                      onBlur={() => setHoveredRegionId(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedRegion(region)
                        }
                      }}
                    >
                      {/* SVG-native animation stays centered on the hotspot. */}
                      {isSelected && (
                        <circle
                          cx={region.coordinates.x}
                          cy={region.coordinates.y}
                          r="4"
                          fill="none"
                          stroke={region.color}
                          strokeWidth="0.5"
                          pointerEvents="none"
                        >
                          <animate
                            attributeName="r"
                            values="4;7;4"
                            dur="1.8s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.75;0.1;0.75"
                            dur="1.8s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                      
                      {/* Interactive Node Marker */}
                      <circle
                        cx={region.coordinates.x}
                        cy={region.coordinates.y}
                        r={isSelected ? '3.5' : isHovered ? '3' : '2.5'}
                        fill={isSelected ? region.color : '#F5F2EB'}
                        stroke="#0C0C0E"
                        strokeWidth="0.75"
                        className="transition-[r] duration-150"
                      />

                      {/* Region Label Tag */}
                      <text
                        x={region.coordinates.x + 4}
                        y={region.coordinates.y + 1.5}
                        fill={isSelected ? '#D4A034' : '#C5BAA5'}
                        fontSize="3"
                        fontFamily="JetBrains Mono"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        className="select-none transition-colors duration-300"
                      >
                        {region.name.split(' ')[0]}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Map Region Quick Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-ivory-100/10">
              {MAP_REGIONS.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg)}
                  type="button"
                  className={`font-mono text-2xs px-3 py-1.5 rounded uppercase tracking-wider transition-all duration-300 ${
                    selectedRegion.id === reg.id
                      ? 'bg-bronze-400 text-charcoal-950 font-bold'
                      : 'bg-charcoal-900 text-ivory-300 border border-ivory-100/10 hover:border-bronze-400/40'
                  }`}
                >
                  {reg.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column — Selected Region Civilizational Profile Panel */}
          <div className="lg:col-span-5 card p-6 md:p-8 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-sand-200 dark:border-dark-border pb-3">
                <span className="badge badge-primary">
                  REGIONAL PROFILE
                </span>
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400 uppercase">
                  ZONE #0{MAP_REGIONS.findIndex((r) => r.id === selectedRegion.id) + 1}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="heading-lg text-gray-900 dark:text-white">
                  {selectedRegion.name}
                </h3>
                <p className="font-serif italic text-sm text-primary-600 dark:text-accent-400">
                  {selectedRegion.subtitle}
                </p>
              </div>

              <p className="font-sans text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {selectedRegion.summary}
              </p>
            </div>

            {/* Structured Regional Metadata Table */}
            <div className="space-y-3 pt-4 border-t border-sand-200 dark:border-dark-border">
              <div>
                <span className="text-xs font-semibold text-primary-600 dark:text-accent-400 uppercase tracking-wider block mb-1">
                  Historic Empires & Kingdoms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRegion.empires.map((emp) => (
                    <span key={emp} className="badge badge-gray text-xs">
                      {emp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-primary-600 dark:text-accent-400 uppercase tracking-wider block mb-1">
                  Major Trade Goods:
                </span>
                <span className="font-sans text-xs text-gray-600 dark:text-gray-300">
                  {selectedRegion.tradeGoods.join(' · ')}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-primary-600 dark:text-accent-400 uppercase tracking-wider block mb-1">
                  Architectural Style:
                </span>
                <span className="font-sans text-xs text-gray-600 dark:text-gray-300">
                  {selectedRegion.architecturalStyle}
                </span>
              </div>
            </div>

            {/* Action Button to Filter Catalog */}
            <button
              onClick={handleExploreRegion}
              className="btn btn-primary btn-md w-full"
            >
              Explore Regional Archive
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
