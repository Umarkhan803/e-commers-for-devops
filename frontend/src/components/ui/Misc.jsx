import { cn, formatPrice, discountPercent } from '../../lib/utils'

/** Price with optional struck-through compare-at value and saving percentage. */
export function PriceTag({ price, compareAt, size = 'md', className, showPercent = true }) {
  const percent = discountPercent(price, compareAt)
  const sizes = {
    sm: { price: 'text-sm', compare: 'text-xs' },
    md: { price: 'text-lg', compare: 'text-sm' },
    lg: { price: 'text-3xl', compare: 'text-base' },
  }
  const scale = sizes[size] ?? sizes.md

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-bold tracking-tight text-ink-900', scale.price)}>
        {formatPrice(price)}
      </span>
      {percent > 0 ? (
        <>
          <span className={cn('text-ink-400 line-through', scale.compare)}>
            {formatPrice(compareAt)}
          </span>
          {showPercent ? (
            <span className={cn('font-semibold text-emerald-600', scale.compare)}>
              {percent}% off
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, description, action, align = 'left', className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white/70 px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="size-7" aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden="true" />
}

export function ProductCardSkeleton({ className }) {
  return (
    <div className={cn('surface-card overflow-hidden p-3', className)}>
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2.5 px-1 pb-1 pt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  )
}

/** Small stat block used across the hero, trust bar and account panels. */
export function StatPill({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/80 text-brand-600 shadow-soft ring-1 ring-ink-100">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink-900">{value}</span>
        <span className="block truncate text-xs text-ink-500">{label}</span>
      </span>
    </div>
  )
}
