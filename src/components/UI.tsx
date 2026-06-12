import React from 'react'
import { Loader } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  isFullWidth?: boolean
}

/**
 * Botão reutilizável com variantes e estados
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
      primary: 'bg-primary-900 text-white hover:bg-primary-800 focus:ring-primary-500',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
      success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500',
      danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
      warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500',
      ghost: 'bg-transparent text-primary-900 hover:bg-gray-100 focus:ring-gray-300 dark:text-white dark:hover:bg-gray-800'
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg'
    }

    const widthClasses = isFullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`}
        {...props}
      >
        {isLoading && <Loader className="animate-spin-fast" size={18} />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  isRequired?: boolean
}

/**
 * Input reutilizável com label, validação e ícone
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, isRequired = false, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {isRequired && <span className="text-danger-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>}
          <input
            ref={ref}
            className={`w-full px-4 py-2.5 ${icon ? 'pl-10' : ''} border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              error
                ? 'border-danger-500 focus:border-danger-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'
            } dark:bg-gray-800 dark:text-white ${className}`}
            {...props}
          />
        </div>

        {error && <p className="text-sm text-danger-500 mt-1">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

/**
 * Card reutilizável para agrupar conteúdo
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white dark:bg-gray-800',
      bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 shadow-lg'
    }

    return (
      <div
        ref={ref}
        className={`rounded-lg p-6 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

/**
 * Badge para exibir status/labels
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'gray'
  size?: 'sm' | 'md' | 'lg'
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100',
    secondary: 'bg-secondary-100 text-secondary-900 dark:bg-secondary-900 dark:text-secondary-100',
    success: 'bg-success-100 text-success-900 dark:bg-success-900 dark:text-success-100',
    danger: 'bg-danger-100 text-danger-900 dark:bg-danger-900 dark:text-danger-100',
    
    // AQUI MUDOU: De bg-warning-100 para bg-warning-500 e text-white
    warning: 'bg-warning-500 text-white dark:bg-warning-600 dark:text-white shadow-sm', 
    
    info: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    gray: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span
      className={`inline-block font-semibold rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Alert para mensagens
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  onClose?: () => void
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  onClose,
  children,
  className = '',
  ...props
}) => {
  const typeClasses = {
    success: 'bg-success-50 border-success-300 text-success-800 dark:bg-success-900 dark:border-success-700 dark:text-success-100',
    error: 'bg-danger-50 border-danger-300 text-danger-800 dark:bg-danger-900 dark:border-danger-700 dark:text-danger-100',
    warning: 'bg-warning-50 border-warning-300 text-warning-800 dark:bg-warning-900 dark:border-warning-700 dark:text-warning-100',
    info: 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100'
  }

  return (
    <div
      className={`border-l-4 p-4 rounded ${typeClasses[type]} ${className}`}
      {...props}
    >
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      <div className="text-sm">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-2 text-xs font-medium opacity-75 hover:opacity-100 transition-opacity"
        >
          Fechar
        </button>
      )}
    </div>
  )
}

/**
 * Loading Spinner
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'text-primary-500',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div
      className={`inline-block animate-spin ${sizeClasses[size]} ${color} ${className}`}
      {...props}
    >
      <Loader className="w-full h-full" />
    </div>
  )
}

/**
 * Modal/Dialog component
 */
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  showCloseButton?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  children,
  className = '',
  ...props
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/**
 * Skeleton Loading
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  count = 1,
  height = 'h-4',
  className = '',
  ...props
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 ${className}`}
          {...props}
        />
      ))}
    </>
  )
}

/**
 * Divider
 */
export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  variant?: 'horizontal' | 'vertical'
  spacing?: 'sm' | 'md' | 'lg'
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'horizontal',
  spacing = 'md',
  className = '',
  ...props
}) => {
  const spacingClasses = {
    sm: variant === 'horizontal' ? 'my-2' : 'mx-2',
    md: variant === 'horizontal' ? 'my-4' : 'mx-4',
    lg: variant === 'horizontal' ? 'my-6' : 'mx-6'
  }

  if (variant === 'vertical') {
    return (
      <div
        className={`inline-block w-px h-full bg-gray-300 dark:bg-gray-600 ${spacingClasses[spacing]} ${className}`}
        {...props}
      />
    )
  }

  return (
    <hr
      className={`border-gray-300 dark:border-gray-600 ${spacingClasses[spacing]} ${className}`}
      {...props}
    />
  )
}
