import { PackageSearch } from 'lucide-react'
import ProductCard from './ProductCard'
import { EmptyState, ProductCardSkeleton } from '../ui/Misc'
import Button from '../ui/Button'
import { cn } from '../../lib/utils'

export default function ProductGrid({
  products,
  onQuickView,
  layout = 'grid',
  loading = false,
  onReset,
  columns = 'sm:grid-cols-2 xl:grid-cols-3',
  className,
}) {
  if (loading) {
    return (
      <div className={cn('grid gap-5', columns, className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products match those filters"
        description="Try widening your price range, clearing a brand, or searching for something broader."
        action={
          onReset ? (
            <Button variant="outline" onClick={onReset}>
              Clear all filters
            </Button>
          ) : null
        }
      />
    )
  }

  return (
    <div className={cn(layout === 'list' ? 'space-y-4' : cn('grid gap-5', columns), className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onQuickView={onQuickView}
          layout={layout}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        />
      ))}
    </div>
  )
}
