import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  withArrow?: boolean
  children: React.ReactNode
}

// Thin wrapper over the site-wide .btn classes so the museum and the portal share one button.
const VARIANTS = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  secondary: 'btn-outline',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
} as const

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  withArrow = false,
  type = 'button',
  children,
  className,
  ...props
}) => (
  <button type={type} className={cn('btn group gap-2', `btn-${size}`, VARIANTS[variant], className)} {...props}>
    <span>{children}</span>
    {withArrow && <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
  </button>
)
