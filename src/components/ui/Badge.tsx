import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'bronze' | 'ivory' | 'dark' | 'burgundy' | 'savanna'
  size?: 'sm' | 'md'
  className?: string
}

// Maps the museum's badge names onto the site-wide .badge styles.
const VARIANTS = {
  bronze: 'badge-accent',
  ivory: 'badge-gray',
  dark: 'badge-gray',
  burgundy: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800/50',
  savanna: 'badge-primary',
} as const

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'bronze', size = 'sm', className }) => (
  <span className={cn('badge', size === 'md' && 'text-xs px-3 py-1', VARIANTS[variant], className)}>{children}</span>
)
