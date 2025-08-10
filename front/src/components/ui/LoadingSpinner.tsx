import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'

  return (
    <div
      className={`spinner ${sizeClass} ${className}`}
      role="status"
      aria-label="Chargement..."
    >
      <span className="sr-only">Chargement...</span>
    </div>
  )
}
