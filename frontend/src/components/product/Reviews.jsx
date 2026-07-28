import { CheckCircle2, ThumbsUp } from 'lucide-react'
import Rating from '../ui/Rating'
import Button from '../ui/Button'
import { cn, formatCompact, formatDate } from '../../lib/utils'

/** Derives a plausible star distribution from the aggregate rating. */
function distributionFor(rating, total) {
  const weights = [0, 0, 0, 0, 0]
  const base = [0.02, 0.04, 0.08, 0.24, 0.62]
  const shift = (rating - 4.4) * 0.5

  base.forEach((weight, index) => {
    const adjusted = index >= 3 ? weight + shift * (index - 2) * 0.4 : Math.max(weight - shift * 0.3, 0.005)
    weights[index] = adjusted
  })

  const sum = weights.reduce((total_, weight) => total_ + weight, 0)
  return weights
    .map((weight, index) => ({
      stars: index + 1,
      count: Math.round((weight / sum) * total),
    }))
    .reverse()
}

export function ReviewSummary({ product, className }) {
  const distribution = distributionFor(product.rating, product.reviewCount)
  const max = Math.max(...distribution.map((row) => row.count), 1)

  return (
    <div className={cn('grid gap-8 sm:grid-cols-[auto_1fr]', className)}>
      <div className="text-center sm:text-left">
        <p className="text-5xl font-extrabold tracking-tight text-ink-900">
          {product.rating.toFixed(1)}
        </p>
        <div className="mt-2 flex justify-center sm:justify-start">
          <Rating value={product.rating} size="lg" showValue={false} />
        </div>
        <p className="mt-2 text-sm text-ink-500">
          {formatCompact(product.reviewCount)} verified reviews
        </p>
        <Button variant="outline" size="sm" className="mt-4">
          Write a review
        </Button>
      </div>

      <div className="space-y-2">
        {distribution.map((row) => (
          <div key={row.stars} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs font-semibold text-ink-600">{row.stars} star</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-400">
              {formatCompact(row.count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReviewList({ reviews, className }) {
  return (
    <ul className={cn('space-y-4', className)}>
      {reviews.map((review) => (
        <li key={review.id} className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
                {review.author
                  .split(' ')
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')}
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                  {review.author}
                  {review.verified ? (
                    <span
                      className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600"
                      title="Verified purchase"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Verified
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-ink-400">{formatDate(review.date)}</p>
              </div>
            </div>
            <Rating value={review.rating} size="sm" showValue={false} />
          </div>

          <h4 className="mt-4 text-sm font-bold text-ink-900">{review.title}</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{review.body}</p>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <ThumbsUp className="size-3.5" />
            Helpful ({review.helpful})
          </button>
        </li>
      ))}
    </ul>
  )
}
