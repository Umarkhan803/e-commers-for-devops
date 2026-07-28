import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ChevronRight, Sparkles } from 'lucide-react'
import FilterPanel from '../../components/product/FilterPanel'
import ProductGrid from '../../components/product/ProductGrid'
import QuickViewModal from '../../components/product/QuickViewModal'
import {
  ActiveFilterChips,
  ShopSearchField,
  SortBar,
} from '../../components/product/ShopToolbar'
import Drawer from '../../components/ui/Drawer'
import Button from '../../components/ui/Button'
import { ProductCardSkeleton } from '../../components/ui/Misc'
import { useCatalog } from '../../context/CatalogContext'
import { fetchProducts, filtersToParams } from '../../api/products'
import { useAsyncData, useDebouncedValue } from '../../hooks/useAsyncData'
import { filtersFromSearchParams, filtersToSearchParams } from '../../lib/filtering'

const PAGE_SIZE = 9

/**
 * Product browsing section. The URL query string is the single source of truth
 * for filter state, and every change re-queries the API — matching, sorting and
 * pagination all happen in MongoDB rather than over a client-side copy.
 */
export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { categories, priceBounds, isLoading: catalogLoading } = useCatalog()

  const [layout, setLayout] = useState('grid')
  const [page, setPage] = useState(1)
  const [accumulated, setAccumulated] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  const filters = useMemo(
    () => filtersFromSearchParams(searchParams, priceBounds),
    [searchParams, priceBounds],
  )

  // Typing in the search field should not fire a request per keystroke.
  const debouncedQuery = useDebouncedValue(filters.query, 300)
  const queryKey = JSON.stringify({ ...filters, query: debouncedQuery })

  const { data, error, isLoading } = useAsyncData(
    (signal) =>
      fetchProducts(
        filtersToParams({ ...filters, query: debouncedQuery }, priceBounds, {
          page,
          limit: PAGE_SIZE,
        }),
        { signal },
      ),
    [queryKey, page, priceBounds.max],
    { skip: catalogLoading },
  )

  // A filter change resets to page one; "show more" appends instead of replacing.
  useEffect(() => {
    setPage(1)
    setAccumulated([])
  }, [queryKey])

  useEffect(() => {
    if (!data) return
    setAccumulated((current) =>
      data.meta.page === 1 ? data.items : [...current, ...data.items],
    )
  }, [data])

  const total = data?.meta.total ?? 0
  const hasNextPage = data?.meta.hasNextPage ?? false
  const products = accumulated

  const updateFilters = (patch) => {
    setSearchParams(filtersToSearchParams({ ...filters, ...patch }, priceBounds), {
      replace: true,
    })
  }

  const resetFilters = () => setSearchParams(new URLSearchParams(), { replace: true })

  const activeCategory =
    filters.categories.length === 1
      ? categories.find((category) => category.slug === filters.categories[0])
      : null

  const heading = filters.query
    ? `Results for “${filters.query}”`
    : (activeCategory?.name ?? 'All products')

  const showInitialSkeletons = isLoading && products.length === 0

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page py-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-500">
            <Link to="/" className="transition hover:text-brand-600">
              Home
            </Link>
            <ChevronRight className="size-3.5 text-ink-300" aria-hidden="true" />
            <Link to="/shop" className="transition hover:text-brand-600">
              Shop
            </Link>
            {activeCategory ? (
              <>
                <ChevronRight className="size-3.5 text-ink-300" aria-hidden="true" />
                <span className="font-semibold text-ink-800">{activeCategory.name}</span>
              </>
            ) : null}
          </nav>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                {heading}
              </h1>
              <p className="mt-2 max-w-2xl text-[0.9375rem] text-ink-500">
                {activeCategory?.blurb ??
                  'Filter by category, brand, price, rating and availability. Every change queries the catalogue.'}
              </p>
            </div>
            <ShopSearchField
              value={filters.query}
              onChange={(query) => updateFilters({ query })}
              resultCount={total}
              isLoading={isLoading}
              className="w-full lg:max-w-md"
            />
          </div>

          {/* Category quick-switch strip mirrors the header nav for deep links. */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => updateFilters({ categories: [] })}
              className={
                filters.categories.length === 0
                  ? 'shrink-0 rounded-full bg-ink-900 px-3.5 py-1.5 text-sm font-semibold text-white'
                  : 'shrink-0 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700'
              }
            >
              All
            </button>
            {categories.map((category) => {
              const selected = filters.categories.includes(category.slug)
              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => updateFilters({ categories: selected ? [] : [category.slug] })}
                  className={
                    selected
                      ? 'shrink-0 rounded-full bg-ink-900 px-3.5 py-1.5 text-sm font-semibold text-white'
                      : 'shrink-0 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700'
                  }
                >
                  {category.name}
                  <span className="ml-1.5 text-xs opacity-60">{category.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="grid gap-7 lg:grid-cols-[17rem_1fr]">
          <FilterPanel
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            className="sticky top-[10.5rem] hidden max-h-[calc(100vh-12rem)] overflow-y-auto lg:block"
          />

          <div className="min-w-0">
            <SortBar
              filters={filters}
              onChange={updateFilters}
              resultCount={total}
              layout={layout}
              onLayoutChange={setLayout}
              onOpenFilters={() => setFiltersOpen(true)}
            />

            <ActiveFilterChips
              filters={filters}
              onChange={updateFilters}
              onReset={resetFilters}
              className="mt-4"
            />

            {error ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-6 py-10 text-center">
                <AlertCircle className="size-6 text-red-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink-900">Could not load products</p>
                <p className="max-w-sm text-xs text-ink-500">{error.message}</p>
              </div>
            ) : showInitialSkeletons ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <ProductGrid
                products={products}
                onQuickView={setQuickViewProduct}
                layout={layout}
                onReset={resetFilters}
                columns="sm:grid-cols-2 xl:grid-cols-3"
                className="mt-5"
              />
            )}

            {hasNextPage ? (
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-xs text-ink-400">
                  Showing {products.length} of {total}
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  loading={isLoading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Show more products
                </Button>
              </div>
            ) : null}

            {products.length > 0 && !hasNextPage ? (
              <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-8 text-center">
                <Sparkles className="size-5 text-brand-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink-800">
                  That is everything matching your filters
                </p>
                <p className="max-w-sm text-xs text-ink-500">
                  Widen the price range or clear a brand to see more of the catalogue.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        subtitle={`${total} products match`}
        side="left"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={resetFilters}>
              Reset
            </Button>
            <Button fullWidth onClick={() => setFiltersOpen(false)}>
              Show {total} results
            </Button>
          </div>
        }
      >
        <FilterPanel
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          showHeader={false}
          className="-mt-4 border-none bg-transparent p-0 shadow-none"
        />
      </Drawer>

      <QuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  )
}
