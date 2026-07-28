import { cn } from '../../lib/utils'

const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-100 text-brand-700',
  sale: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_6px_16px_-8px_rgba(244,63,94,0.9)]',
  new: 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-[0_6px_16px_-8px_rgba(79,70,229,0.9)]',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-700',
  outline: 'border border-ink-200 bg-white/80 text-ink-600',
}

export default function Badge({ tone = 'neutral', className, icon: Icon, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
