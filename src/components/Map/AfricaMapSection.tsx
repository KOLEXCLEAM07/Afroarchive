import React, { useState } from 'react'
import { Compass } from 'lucide-react'
import { MAP_REGIONS, RegionProfile } from '../../data/mapData'

const REGION_NAMES: Record<string, string> = {
  west: 'West Africa',
  east: 'East Africa',
  north: 'North Africa',
  central: 'Central Africa',
  southern: 'Southern Africa',
}

export interface AfricaMapSectionProps {
  onExploreRegion?: (regionKey: string) => void
}

export const AfricaMapSection: React.FC<AfricaMapSectionProps> = ({ onExploreRegion }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionProfile>(MAP_REGIONS[0])
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null)

  const handleExploreRegion = () => {
    onExploreRegion?.(selectedRegion.regionKey)
  }

  return (
    <section
      id="map"
      aria-label="Interactive Africa Map and Regional Discovery"
      className="py-12 md:py-16 bg-dark-bg border-t border-white/10 text-ivory-100 overflow-hidden"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Cartographic exhibition</span>
              <span className="text-xs text-ivory-400">
                Historical regional zones
              </span>
            </div>

            <h2 className="heading-xl text-white">
              Interactive Africa map
            </h2>

            <p className="text-sm md:text-base text-ivory-300 leading-relaxed">
              Explore the historical civilizational zones, trade routes, capital cities, and architectural traditions across Africa.
            </p>
          </div>

          <span className="badge badge-gray self-start md:self-auto">
            Select a regional zone
          </span>
        </div>

        {/* Map & Region Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column — Interactive Cartographic Vector Map */}
          <div className="lg:col-span-7 card rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            {/* Map Header */}
            <div className="flex justify-between items-center text-ivory-400 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-accent-400" aria-hidden="true" />
                <span>Historical regions (schematic, not to scale)</span>
              </div>
            </div>

            {/* Interactive SVG Map Vector Representation */}
            <div className="relative aspect-[4/3.8] w-full my-auto flex items-center justify-center bg-dark-surface rounded-xl border border-white/5 p-4 overflow-hidden">
              
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
                        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
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
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
              {MAP_REGIONS.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg)}
                  type="button"
                  aria-pressed={selectedRegion.id === reg.id}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                    selectedRegion.id === reg.id
                      ? 'border-accent-400/50 bg-accent-400/15 text-accent-300'
                      : 'border-white/10 bg-white/5 text-ivory-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {reg.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column — Selected Region Civilizational Profile Panel */}
          <div className="lg:col-span-5 card rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="eyebrow">
                  Regional profile
                </span>
                <span className="text-xs text-ivory-400">
                  Zone 0{MAP_REGIONS.findIndex((r) => r.id === selectedRegion.id) + 1}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="heading-lg text-white">
                  {selectedRegion.name}
                </h3>
                <p className="font-serif italic text-base text-accent-300">
                  {selectedRegion.subtitle}
                </p>
              </div>

              <p className="text-sm text-ivory-300 leading-relaxed">
                {selectedRegion.summary}
              </p>
            </div>

            {/* Structured Regional Metadata Table */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <span className="text-xs font-semibold text-accent-300 block mb-1.5">
                  Historic empires & kingdoms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRegion.empires.map((emp) => (
                    <span key={emp} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-ivory-200">
                      {emp}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-accent-300 block mb-1.5">
                  Major trade goods
                </span>
                <span className="text-sm text-ivory-300">
                  {selectedRegion.tradeGoods.join(' · ')}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-accent-300 block mb-1.5">
                  Architectural style
                </span>
                <span className="text-sm text-ivory-300">
                  {selectedRegion.architecturalStyle}
                </span>
              </div>
            </div>

            {/* Action Button to Filter Catalog */}
            {onExploreRegion && (
              <button
                onClick={handleExploreRegion}
                type="button"
                className="btn btn-primary btn-md w-full"
              >
                Browse {REGION_NAMES[selectedRegion.regionKey] ?? 'this region'} in the collection
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
