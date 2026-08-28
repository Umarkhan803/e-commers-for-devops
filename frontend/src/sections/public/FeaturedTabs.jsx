import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductGrid from '../../components/product/ProductGrid'
import { SectionHeading, ProductCardSkeleton } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import { fetchProducts } from '../../api/products'
import { useAsyncData } from '../../hooks/useAsyncData'
import { cn } from '../../lib/utils'

/** Each tab is a query against the catalogue rather than a client-side filter. */
const TABS = [
  { id: 'bestsellers', label: 'Bestsellers', params: { tags: 'bestseller', sort: 'popular' } },
  { id: 'new', label: 'New arrivals', params: { tags: 'new', sort: 'newest' } },
  { id: 'top-rated', label: 'Top rated', params: { sort: 'rating-desc' } },
  { id: 'under-200', label: 'Under $200', params: { maxPrice: 200, sort: 'rating-desc' } },
]

export default function FeaturedTabs({ onQuickView }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const tab = TABS.find((candidate) => candidate.id === activeTab) ?? TABS[0]

  const { data, isLoading } = useAsyncData(
    (signal) => fetchProducts({ ...tab.params, limit: 6 }, { signal }),
    [activeTab],
  )
  const products = data?.items ?? []

  return (
    <section className="container-page py-14 sm:py-16">
      <SectionHeading
        eyebrow="Handpicked"
        title="What people are buying"
        description="Ranked by verified purchases and review scores from the last 30 days."
        action={
          <Button as={Link} to="/shop" variant="outline">
            Browse everything
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="Featured product collections"
        className="mt-7 flex gap-1 overflow-x-auto border-b border-ink-200 pb-0 no-scrollbar"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative shrink-0 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-brand-700 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-brand-600'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <ProductGrid
          products={products}
          onQuickView={onQuickView}
          className="mt-6"
          columns="sm:grid-cols-2 lg:grid-cols-3"
        />
      )}
    </section>
  )
}
