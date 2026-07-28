import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const VARIANTS = {
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.7)] hover:from-brand-500 hover:to-brand-700 hover:shadow-[0_12px_26px_-10px_rgba(79,70,229,0.8)] active:translate-y-px',
  secondary:
    'bg-ink-900 text-white shadow-[0_8px_20px_-10px_rgba(20,26,44,0.8)] hover:bg-ink-800 active:translate-y-px',
  outline:
    'border border-ink-200 bg-white text-ink-800 shadow-soft hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700',
  ghost: 'text-ink-600 hover:bg-ink-100/80 hover:text-ink-900',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'bg-rose-600 text-white shadow-soft hover:bg-rose-700',
}

const SIZES = {
  sm: 'h-9 gap-1.5 px-3.5 text-[0.8125rem]',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-12 gap-2 px-6 text-[0.9375rem]',
  icon: 'size-10 justify-center',
  'icon-sm': 'size-9 justify-center',
}

/**
 * Primary interactive control. Pass `as={Link}` (or any component) to keep the
 * visual treatment while changing the rendered element.
 */
const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    className,
    loading = false,
    disabled,
    fullWidth = false,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <Component
      ref={ref}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </Component>
  )
})

export default Button
