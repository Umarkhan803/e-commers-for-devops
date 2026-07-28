import { Minus, Plus } from 'lucide-react'
import { cn, clamp } from '../../lib/utils'

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = 'md',
  label = 'Quantity',
  className,
}) {
  const set = (next) => onChange(clamp(next, min, max))
  const compact = size === 'sm'

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-ink-200 bg-white shadow-soft',
        compact ? 'h-9' : 'h-11',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={cn(
          'grid place-items-center rounded-l-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 disabled:opacity-35 disabled:hover:bg-transparent',
          compact ? 'size-9' : 'size-11',
        )}
      >
        <Minus className={compact ? 'size-3.5' : 'size-4'} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={value}
        aria-label={label}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value.replace(/\D/g, ''), 10)
          if (!Number.isNaN(parsed)) set(parsed)
        }}
        className={cn(
          'border-x border-ink-100 bg-transparent text-center font-semibold text-ink-900 focus:outline-none',
          compact ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm',
        )}
      />

      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={cn(
          'grid place-items-center rounded-r-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 disabled:opacity-35 disabled:hover:bg-transparent',
          compact ? 'size-9' : 'size-11',
        )}
      >
        <Plus className={compact ? 'size-3.5' : 'size-4'} />
      </button>
    </div>
  )
}
