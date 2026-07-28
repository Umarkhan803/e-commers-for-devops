import { ArrowUpDown, LayoutGrid, List, Loader2, Search, SlidersHorizontal, X } from 'lucide-react'
import { useCatalog } from '../../context/CatalogContext'
import { activeFilterCount } from '../../lib/filtering'
import { cn, formatPrice } from '../../lib/utils'

/** In-page keyword field, bound to the filter state that drives the API query. */
export function ShopSearchField({ value, onChange, resultCount, isLoading, className }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search within these results"
        aria-label="Search products"
        className="h-12 w-full rounded-full border border-ink-200 bg-white pl-11 pr-28 text-sm shadow-soft placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="rounded-full p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
          >
            <X className="size-4" />
          </button>
        ) : null}
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin text-ink-400" aria-hidden="true" />
        ) : null}
        <span className="text-xs font-semibold tabular-nums text-ink-400">
          {resultCount} found
        </span>
      </span>
    </div>
  )
}

export function SortBar({
  filters,
  onChange,
  resultCount,
  layout,
  onLayoutChange,
  onOpenFilters,
  className,
}) {
  const { priceBounds, sortOptions, totals } = useCatalog()
  const count = activeFilterCount(filters, priceBounds)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white px-3.5 py-3 shadow-soft',
        className,
      )}
    >
      <p className="text-sm text-ink-600">
        Matching <span className="font-bold text-ink-900">{resultCount}</span> of{' '}
        {totals?.products ?? 0} products
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 rounded-full border border-ink-200 px-3.5 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700 lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {count ? (
            <span className="rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-bold text-white">
              {count}
            </span>
          ) : null}
        </button>

        <div className="relative">
          <ArrowUpDown
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <select
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value })}
            aria-label="Sort products"
            className="h-10 appearance-none rounded-full border border-ink-200 bg-white pl-9 pr-8 text-sm font-semibold text-ink-800 transition hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden items-center gap-1 rounded-full border border-ink-200 p-1 sm:flex">
          {[
            { id: 'grid', icon: LayoutGrid, label: 'Grid view' },
            { id: 'list', icon: List, label: 'List view' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onLayoutChange(option.id)}
              aria-label={option.label}
              aria-pressed={layout === option.id}
              className={cn(
                'grid size-8 place-items-center rounded-full transition',
                layout === option.id
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700',
              )}
            >
              <option.icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Removable summary of every non-default filter currently applied. */
export function ActiveFilterChips({ filters, onChange, onReset, className }) {
  const { priceBounds, categoryName, brandName } = useCatalog()
  const chips = []

  filters.categories.forEach((slug) => {
    chips.push({
      key: `category-${slug}`,
      label: categoryName(slug),
      clear: () => onChange({ categories: filters.categories.filter((entry) => entry !== slug) }),
    })
  })

  filters.brands.forEach((slug) => {
    chips.push({
      key: `brand-${slug}`,
      label: brandName(slug),
      clear: () => onChange({ brands: filters.brands.filter((entry) => entry !== slug) }),
    })
  })

  if (filters.minPrice > priceBounds.min || filters.maxPrice < priceBounds.max) {
    chips.push({
      key: 'price',
      label: `${formatPrice(filters.minPrice)} – ${formatPrice(filters.maxPrice)}`,
      clear: () => onChange({ minPrice: priceBounds.min, maxPrice: priceBounds.max }),
    })
  }

  if (filters.minRating) {
    chips.push({
      key: 'rating',
      label: `${filters.minRating}★ & up`,
      clear: () => onChange({ minRating: 0 }),
    })
  }

  if (filters.availability !== 'all') {
    chips.push({
      key: 'availability',
      label: filters.availability === 'in-stock' ? 'In stock' : 'On sale',
      clear: () => onChange({ availability: 'all' }),
    })
  }

  if (filters.freeShippingOnly) {
    chips.push({
      key: 'shipping',
      label: 'Free delivery',
      clear: () => onChange({ freeShippingOnly: false }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="group inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
        >
          {chip.label}
          <X className="size-3.5 opacity-60 transition group-hover:opacity-100" />
        </button>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-500 underline underline-offset-4 transition hover:text-rose-600"
      >
        Clear all
      </button>
    </div>
  )
}
