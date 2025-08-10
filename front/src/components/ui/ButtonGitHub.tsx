import { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    default: 'bg-btn border border-btn btn-text hover:bg-btn-hover hover:border-btn-hover',
    primary: 'bg-btn-primary border border-btn-primary btn-primary-text hover:bg-btn-primary-hover hover:border-btn-primary-hover',
    success: 'bg-success border border-success text-white hover:bg-success-muted',
    danger: 'bg-danger border border-danger text-white hover:bg-danger-muted',
    outline: 'border border-default btn-text hover:bg-canvas-subtle',
    ghost: 'btn-text hover:bg-canvas-subtle'
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  )
}

// Variantes de boutons spécialisés
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" {...props} />
}

export function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="danger" {...props} />
}

export function SuccessButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="success" {...props} />
}

export function OutlineButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="outline" {...props} />
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="ghost" {...props} />
}
