import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h2 className={`card-title ${className}`}>
      {children}
    </h2>
  )
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`card-description ${className}`}>
      {children}
    </p>
  )
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-default ${className}`}>
      {children}
    </div>
  )
}
