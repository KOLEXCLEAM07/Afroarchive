import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'bronze' | 'ivory' | 'dark' | 'burgundy' | 'savanna'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'bronze',
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-metadata px-2.5 py-1 tracking-widest',
    md: 'text-xs px-3.5 py-1.5 tracking-widest',
  }

  const variantStyles = {
    bronze: 'bg-bronze-900/60 text-bronze-300 border border-bronze-400/30',
    ivory: 'bg-ivory-100/10 text-ivory-100 border border-ivory-100/20',
    dark: 'bg-charcoal-800 text-ivory-300 border border-charcoal-700',
    burgundy: 'bg-burgundy-900/60 text-red-200 border border-burgundy-700/40',
    savanna: 'bg-savanna-900/60 text-emerald-200 border border-savanna-600/40',
  }

  return (
    <span
      className={`inline-flex items-center font-mono font-medium uppercase rounded-sm transition-colors duration-300 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
