import { useMemo, useState } from 'react'
import { ChevronDown, RotateCcw, Search, Star, Truck } from 'lucide-react'
import { useCatalog } from '../../context/CatalogContext'
import { fetchFilterMetadata, filtersToParams } from '../../api/products'
import { useAsyncData, useDebouncedValue } from '../../hooks/useAsyncData'
import { activeFilterCount } from '../../lib/filtering'
import { cn, formatPrice } from '../../lib/utils'
import Badge from '../ui/Badge'
import { Checkbox } from '../ui/Field'

function FilterGroup({ title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-ink-100 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
          {title}
          {count ? <Badge tone="brand">{count}</Badge> : null}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-ink-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ? <div className="mt-3.5 animate-fade-in">{children}</div> : null}
    </div>
  )
}

/** Two-handle price slider built from overlapping native range inputs. */
function PriceRange({ min, max, bounds, onChange }) {
  const { min: floor, max: ceiling } = bounds
  const step = Math.max(5, Math.round((ceiling - floor) / 100 / 5) * 5)
  const left = ((min - floor) / (ceiling - floor)) * 100
  const right = ((max - floor) / (ceiling - floor)) * 100

  return (
    <div className="space-y-4">
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
          style={{ left: `${left}%`, right: `${100 - right}%` }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={min}
          aria-label="Minimum price"
          onChange={(event) => onChange(Math.min(Number(event.target.value), max - step), max)}
          className="pointer-events-none absolute inset-x-0 top-0 h-6 w-full"
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={step}
          value={max}
          aria-label="Maximum price"
          onChange={(event) => onChange(min, Math.max(Number(event.target.value), min + step))}
          className="pointer-events-none absolute inset-x-0 top-0 h-6 w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2">
          <span className="block text-[0.625rem] font-semibold uppercase tracking-wide text-ink-400">
            Min
          </span>
          <span className="text-sm font-bold text-ink-900">{formatPrice(min)}</span>
        </div>
        <span className="text-ink-300">—</span>
        <div className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2">
          <span className="block text-[0.625rem] font-semibold uppercase tracking-wide text-ink-400">
            Max
          </span>
          <span className="text-sm font-bold text-ink-900">
            {formatPrice(max)}
            {max >= ceiling ? '+' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

const AVAILABILITY_OPTIONS = [
  { id: 'all', label: 'All products', countKey: null },
  { id: 'in-stock', label: 'In stock only', countKey: 'inStock' },
  { id: 'on-sale', label: 'On sale only', countKey: 'onSale' },
]

/**
 * Counts beside each option come from `GET /products/filters`, scoped to the
 * shopper's other selections, so a number always reflects what that option would
 * actually yield.
 */
export default function FilterPanel({ filters, onChange, onReset, showHeader = true, className }) {
  const catalog = useCatalog()
  const [brandQuery, setBrandQuery] = useState('')

  const { priceBounds } = catalog

  // Counts are scoped to everything except the group being counted, which is why
  // the category and brand selections are dropped from the scope request.
  const scopeKey = JSON.stringify({
    query: filters.query,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minRating: filters.minRating,
    availability: filters.availability,
    freeShippingOnly: filters.freeShippingOnly,
  })
  const debouncedScope = useDebouncedValue(scopeKey, 300)

  const { data: scoped } = useAsyncData(
    (signal) => {
      const scope = JSON.parse(debouncedScope)
      return fetchFilterMetadata(
        filtersToParams({ ...scope, categories: [], brands: [], sort: 'relevance' }, priceBounds),
        { signal },
      )
    },
    [debouncedScope, priceBounds.max],
  )

  const metadata = scoped ?? catalog

  const categoryCounts = useMemo(
    () => new Map((metadata.categories ?? []).map((entry) => [entry.slug, entry.count])),
    [metadata],
  )
  const brandCounts = useMemo(
    () => new Map((metadata.brands ?? []).map((entry) => [entry.slug, entry.count])),
    [metadata],
  )

  const visibleBrands = (catalog.brands ?? []).filter((brand) =>
    brand.name.toLowerCase().includes(brandQuery.trim().toLowerCase()),
  )

  const toggleValue = (key, value) => {
    const current = filters[key]
    onChange({
      [key]: current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    })
  }

  const activeCount = activeFilterCount(filters, priceBounds)
  const ratingOptions = catalog.ratings?.length
    ? catalog.ratings
    : [4.5, 4, 3.5, 3].map((value) => ({ value, count: null }))

  return (
    <aside className={cn('surface-card p-5', className)} aria-label="Product filters">
      {showHeader ? (
        <div className="flex items-center justify-between gap-2 pb-1">
          <h2 className="text-base font-extrabold text-ink-900">
            Filters
            {activeCount ? (
              <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                {activeCount}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-brand-600 disabled:opacity-40 disabled:hover:text-ink-500"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </div>
      ) : null}

      <FilterGroup title="Category" count={filters.categories.length}>
        <div className="space-y-2.5">
          {catalog.categories.map((category) => (
            <div key={category.slug} className="flex items-center justify-between gap-2">
              <Checkbox
                label={category.name}
                checked={filters.categories.includes(category.slug)}
                onChange={() => toggleValue('categories', category.slug)}
              />
              <span className="text-xs font-medium tabular-nums text-ink-400">
                {categoryCounts.get(category.slug) ?? 0}
              </span>
            </div>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <PriceRange
          min={filters.minPrice}
          max={filters.maxPrice}
          bounds={priceBounds}
          onChange={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </FilterGroup>

      <FilterGroup title="Brand" count={filters.brands.length}>
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={brandQuery}
            onChange={(event) => setBrandQuery(event.target.value)}
            placeholder="Find a brand"
            aria-label="Search brands"
            className="h-9 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
        <div className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
          {visibleBrands.length === 0 ? (
            <p className="text-xs text-ink-400">No brands match “{brandQuery}”.</p>
          ) : (
            visibleBrands.map((brand) => (
              <div key={brand.slug} className="flex items-center justify-between gap-2">
                <Checkbox
                  label={brand.name}
                  checked={filters.brands.includes(brand.slug)}
                  onChange={() => toggleValue('brands', brand.slug)}
                />
                <span className="text-xs font-medium tabular-nums text-ink-400">
                  {brandCounts.get(brand.slug) ?? 0}
                </span>
              </div>
            ))
          )}
        </div>
      </FilterGroup>

      <FilterGroup title="Customer rating">
        <div className="space-y-1.5">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange({ minRating: filters.minRating === option.value ? 0 : option.value })
              }
              aria-pressed={filters.minRating === option.value}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition',
                filters.minRating === option.value
                  ? 'bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-200'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              <span className="flex">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Star
                    key={index}
                    className={cn(
                      'size-3.5',
                      index < Math.floor(option.value) ? 'text-amber-400' : 'text-ink-200',
                    )}
                    fill="currentColor"
                  />
                ))}
              </span>
              <span className="flex-1 text-left">{option.value} &amp; up</span>
              {option.count === null ? null : (
                <span className="text-xs font-medium tabular-nums text-ink-400">
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <div className="space-y-1.5">
          {AVAILABILITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ availability: option.id })}
              aria-pressed={filters.availability === option.id}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
                filters.availability === option.id
                  ? 'bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-200'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              <span
                className={cn(
                  'grid size-4 place-items-center rounded-full border-2',
                  filters.availability === option.id ? 'border-brand-600' : 'border-ink-300',
                )}
              >
                {filters.availability === option.id ? (
                  <span className="size-1.5 rounded-full bg-brand-600" />
                ) : null}
              </span>
              <span className="flex-1 text-left">{option.label}</span>
              {option.countKey ? (
                <span className="text-xs font-medium tabular-nums text-ink-400">
                  {catalog.availability?.[option.countKey] ?? 0}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Delivery" defaultOpen={false}>
        <button
          type="button"
          onClick={() => onChange({ freeShippingOnly: !filters.freeShippingOnly })}
          aria-pressed={filters.freeShippingOnly}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition',
            filters.freeShippingOnly
              ? 'border-brand-500 bg-brand-50/70'
              : 'border-ink-200 hover:border-brand-300',
          )}
        >
          <span className="flex items-center gap-2.5">
            <Truck className="size-4 text-brand-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-ink-800">
              Free delivery only
              <span className="ml-1.5 text-xs font-medium text-ink-400">
                {catalog.availability?.freeShipping ?? 0}
              </span>
            </span>
          </span>
          <span
            className={cn(
              'relative h-5 w-9 shrink-0 rounded-full transition-colors',
              filters.freeShippingOnly ? 'bg-brand-600' : 'bg-ink-200',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-4 rounded-full bg-white shadow transition-all',
                filters.freeShippingOnly ? 'left-[1.125rem]' : 'left-0.5',
              )}
            />
          </span>
        </button>
      </FilterGroup>
    </aside>
  )
}
