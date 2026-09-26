import React from 'react'
import { ArrowUpRight } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon = true,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'group relative inline-flex items-center justify-center font-sans font-semibold tracking-wider uppercase transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-900 disabled:opacity-50 disabled:pointer-events-none'

  const sizeStyles = {
    sm: 'text-2xs px-4 py-2.5 gap-2',
    md: 'text-xs px-6 py-3.5 gap-3',
    lg: 'text-sm px-8 py-4 gap-3.5',
  }

  const variantStyles = {
    primary:
      'bg-bronze-400 text-charcoal-950 hover:bg-bronze-300 shadow-bronze-glow hover:shadow-museum active:scale-[0.98]',
    secondary:
      'bg-charcoal-800 text-ivory-100 border border-ivory-100/15 hover:border-bronze-400/50 hover:bg-charcoal-700 active:scale-[0.98]',
    outline:
      'bg-transparent text-ivory-100 border border-bronze-400/40 hover:border-bronze-400 hover:text-bronze-300 hover:bg-bronze-900/20 active:scale-[0.98]',
    ghost:
      'bg-transparent text-ivory-300 hover:text-ivory-100 hover:bg-charcoal-800/50 active:scale-[0.98]',
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {icon && (
        <ArrowUpRight
          aria-hidden="true"
          className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </button>
  )
}
