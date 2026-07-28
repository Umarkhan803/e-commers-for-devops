import { Star } from 'lucide-react'
import { cn, formatCompact } from '../../lib/utils'

const SIZES = {
  xs: 'size-3',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
}

/**
 * Star rating with fractional fill. The filled row is clipped to the exact
 * percentage so 4.3 stars reads as 4.3 rather than rounding to 4 or 4.5.
 */
export default function Rating({
  value = 0,
  reviewCount,
  size = 'sm',
  showValue = true,
  className,
  countLabel = 'reviews',
}) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100))
  const starClass = SIZES[size] ?? SIZES.sm

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className="relative inline-flex"
        role="img"
        aria-label={`Rated ${value.toFixed(1)} out of 5`}
      >
        <span className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((index) => (
            <Star key={index} className={cn(starClass, 'text-ink-200')} fill="currentColor" />
          ))}
        </span>
        <span
          className="absolute inset-0 flex gap-0.5 overflow-hidden"
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        >
          {[0, 1, 2, 3, 4].map((index) => (
            <Star
              key={index}
              className={cn(starClass, 'shrink-0 text-amber-400')}
              fill="currentColor"
            />
          ))}
        </span>
      </span>

      {showValue ? (
        <span className="text-xs font-semibold text-ink-800">{value.toFixed(1)}</span>
      ) : null}

      {typeof reviewCount === 'number' ? (
        <span className="text-xs text-ink-400">
          ({formatCompact(reviewCount)} {countLabel})
        </span>
      ) : null}
    </div>
  )
}
