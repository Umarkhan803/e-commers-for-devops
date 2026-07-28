import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export const CHECKOUT_STEPS = [
  { id: 'shipping', label: 'Shipping', hint: 'Where it goes' },
  { id: 'payment', label: 'Payment', hint: 'How you pay' },
  { id: 'review', label: 'Review', hint: 'Confirm order' },
]

/** Horizontal progress indicator; completed steps are clickable to go back. */
export default function CheckoutSteps({ current, onNavigate, className }) {
  const currentIndex = CHECKOUT_STEPS.findIndex((step) => step.id === current)

  return (
    <ol className={cn('flex items-center gap-2 sm:gap-4', className)}>
      {CHECKOUT_STEPS.map((step, index) => {
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!isComplete}
              onClick={() => isComplete && onNavigate?.(step.id)}
              className={cn(
                'flex min-w-0 items-center gap-2.5 text-left transition',
                isComplete && 'cursor-pointer hover:opacity-80',
              )}
            >
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-all duration-300',
                  isComplete && 'bg-emerald-500 text-white',
                  isCurrent &&
                    'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_0_0_4px_rgba(99,102,241,0.18)]',
                  !isComplete && !isCurrent && 'bg-ink-100 text-ink-400',
                )}
              >
                {isComplete ? <Check className="size-4" strokeWidth={3} /> : index + 1}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span
                  className={cn(
                    'block truncate text-sm font-bold',
                    isCurrent ? 'text-ink-900' : 'text-ink-500',
                  )}
                >
                  {step.label}
                </span>
                <span className="block truncate text-xs text-ink-400">{step.hint}</span>
              </span>
            </button>

            {index < CHECKOUT_STEPS.length - 1 ? (
              <span
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors duration-500',
                  index < currentIndex ? 'bg-emerald-400' : 'bg-ink-200',
                )}
                aria-hidden="true"
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
