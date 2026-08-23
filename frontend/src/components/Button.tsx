import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
  children: ReactNode
  showArrow?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  showArrow = false,
  className = '',
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    ghost:   'btn-ghost',
  }[variant]

  const sizeClass = size === 'sm' ? 'btn-sm' : ''

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
      {showArrow && <span className="btn-arrow">→</span>}
    </button>
  )
}
