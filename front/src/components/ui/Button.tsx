import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    children, 
    isLoading = false,
    disabled,
    ...props 
  }, ref) => {
    
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const variantClasses = {
      primary: 'bg-btn-primary text-btn-primary-text border border-btn-primary hover:bg-btn-primary-hover hover:border-btn-primary-hover focus:ring-accent',
      secondary: 'bg-btn text-btn-text border border-btn hover:bg-btn-hover hover:border-btn-hover focus:ring-accent',
      ghost: 'text-fg-default hover:bg-canvas-subtle focus:ring-accent',
      danger: 'bg-danger text-white border border-danger hover:bg-danger-muted focus:ring-danger'
    }
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }

    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    )

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
