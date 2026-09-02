import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={`rounded-xl border border-line bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...rest }: CardProps) {
  return (
    <div {...rest} className={`border-b border-line px-4 py-3 sm:px-5 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ className = '', children, ...rest }: CardProps) {
  return (
    <div {...rest} className={`px-4 py-4 sm:px-5 ${className}`}>
      {children}
    </div>
  )
}
