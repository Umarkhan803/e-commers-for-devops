import { cn } from '../../lib/utils'

const TONES = {
  neutral: 'bg-ink-200 text-ink-800',
  brand: 'bg-brand-50 text-brand-800',
  sale: 'bg-rose-600 text-white',
  new: 'bg-brand-600 text-white',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-rose-100 text-rose-800',
  outline: 'border border-ink-300 bg-white text-ink-700',
}

export default function Badge({ tone = 'neutral', className, icon: Icon, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
