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
      className="relative w-full bg-charcoal-900 text-ivory-100 py-24 border-t border-ivory-100/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ivory-100/10 pb-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">
                CARTOGRAPHIC EXHIBITION
              </Badge>
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400">
                HISTORICAL REGIONAL ZONES
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl md:text-5xl text-ivory-100 tracking-tight">
              INTERACTIVE AFRICA MAP
            </h2>

            <p className="font-sans text-sm md:text-base text-ivory-300 font-light leading-relaxed">
              Explore the historical civilizational zones, trade routes, capital cities, and architectural traditions across Africa.
            </p>
          </div>

          <div className="font-mono text-2xs text-bronze-400 uppercase tracking-widest">
            SELECT REGIONAL ZONE TO INSPECT
          </div>
        </div>

        {/* Map & Region Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column — Interactive Cartographic Vector Map */}
          <div className="lg:col-span-7 bg-charcoal-850 p-6 md:p-8 rounded-lg border border-ivory-100/10 shadow-museum flex flex-col justify-between space-y-6 relative overflow-hidden">
            
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
          <div className="lg:col-span-5 bg-charcoal-850 p-6 md:p-8 rounded-lg border border-ivory-100/10 shadow-artifact flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-ivory-100/10 pb-3">
                <Badge variant="bronze" size="sm">
                  REGIONAL PROFILE
                </Badge>
                <span className="font-mono text-2xs text-ivory-400 uppercase">
                  ZONE #0{MAP_REGIONS.findIndex((r) => r.id === selectedRegion.id) + 1}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-semibold text-2xl text-ivory-100">
                  {selectedRegion.name}
                </h3>
                <p className="font-serif italic text-xs text-bronze-300">
                  {selectedRegion.subtitle}
                </p>
              </div>

              <p className="font-sans text-xs text-ivory-300 font-light leading-relaxed">
                {selectedRegion.summary}
              </p>
            </div>

            {/* Structured Regional Metadata Table */}
            <div className="space-y-3 pt-4 border-t border-ivory-100/10">
              <div>
                <span className="font-mono text-[10px] uppercase text-bronze-400 tracking-wider block mb-1">
                  HISTORIC EMPIRES & KINGDOMS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRegion.empires.map((emp) => (
                    <span key={emp} className="font-mono text-2xs text-ivory-200 bg-charcoal-900 px-2 py-1 rounded border border-ivory-100/5">
                      {emp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-bronze-400 tracking-wider block mb-1">
                  MAJOR TRADE GOODS:
                </span>
                <span className="font-sans text-xs text-ivory-300">
                  {selectedRegion.tradeGoods.join(' · ')}
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-bronze-400 tracking-wider block mb-1">
                  ARCHITECTURAL STYLE:
                </span>
                <span className="font-sans text-xs text-ivory-300">
                  {selectedRegion.architecturalStyle}
                </span>
              </div>
            </div>

            {/* Action Button to Filter Catalog */}
            <Button
              variant="primary"
              size="md"
              onClick={handleExploreRegion}
              className="w-full"
            >
              EXPLORE REGIONAL ARCHIVE
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
