import React, { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  iconRight?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, label, error, helperText, id, iconRight, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={`input ${error ? 'input-error' : ''} ${iconRight ? 'pr-10' : ''} ${className}`}
            ref={ref}
            {...props}
          />
          {iconRight && (
            <span className="absolute inset-y-0 right-3 flex items-center cursor-pointer">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'

export default Input
