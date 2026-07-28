import { createContext, useContext, useMemo } from 'react'
import { fetchFilterMetadata } from '../api/products'
import { useAsyncData } from '../hooks/useAsyncData'

/**
 * The catalogue's shape — categories, brands, price bounds, rating buckets and
 * sort options — is fetched once from `GET /products/filters` and shared. Before
 * the API existed these were hard-coded constants; keeping them in one place
 * means the navigation, filter panel and footer all agree with the database.
 */
const CatalogContext = createContext(null)

const FALLBACK = {
  categories: [],
  brands: [],
  price: { min: 0, max: 2500, average: 0 },
  ratings: [],
  tags: [],
  colors: [],
  availability: { inStock: 0, outOfStock: 0, freeShipping: 0, onSale: 0 },
  sortOptions: [
    { id: 'relevance', label: 'Most relevant' },
    { id: 'popular', label: 'Most popular' },
    { id: 'newest', label: 'Newest arrivals' },
    { id: 'price-asc', label: 'Price: low to high' },
    { id: 'price-desc', label: 'Price: high to low' },
    { id: 'rating-desc', label: 'Highest rated' },
    { id: 'discount', label: 'Biggest discount' },
  ],
  totals: { products: 0, matchingCurrentSelection: 0 },
}

export function CatalogProvider({ children }) {
  const { data, error, isLoading, reload } = useAsyncData(
    (signal) => fetchFilterMetadata({}, { signal }),
    [],
  )

  const value = useMemo(() => {
    const metadata = data ?? FALLBACK

    return {
      ...metadata,
      isLoading,
      error,
      reload,
      // Round the slider bounds outward so the handles sit on tidy numbers.
      priceBounds: {
        min: 0,
        max: Math.ceil((metadata.price?.max ?? FALLBACK.price.max) / 100) * 100,
      },
      categoryName: (slug) =>
        metadata.categories.find((category) => category.slug === slug)?.name ?? slug,
      brandName: (slug) => metadata.brands.find((brand) => brand.slug === slug)?.name ?? slug,
    }
  }, [data, error, isLoading, reload])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return context
}
