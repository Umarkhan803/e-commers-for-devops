import { Link } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import { ArrowRight, PackageCheck, Sparkles, Star, Users } from 'lucide-react'
import Button from '../../components/ui/Button'
import Rating from '../../components/ui/Rating'
import { Skeleton } from '../../components/ui/Misc'
import { fetchProducts } from '../../api/products'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useCatalog } from '../../context/CatalogContext'
import { formatPrice } from '../../lib/utils'

const STATS = [
  { icon: Users, value: '480k+', label: 'Shoppers served' },
  { icon: Star, value: '4.8 / 5', label: 'Average rating' },
  { icon: PackageCheck, value: '2-day', label: 'Median delivery' },
]

export default function Hero() {
  const { totals } = useCatalog()

  const { data } = useAsyncData(
    (signal) => fetchProducts({ sort: 'popular', limit: 3 }, { signal }),
    [],
  )
  const [primary, secondary, tertiary] = data?.items ?? []

  return (
    <section className="relative overflow-hidden border-b border-ink-200 bg-white">
      <div className="gradient-mesh absolute inset-0" aria-hidden="true" />

      <div className="container-page relative grid gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Winter drop is live · up to 40% off
          </span>

          <h1 className="mt-5 text-4xl font-medium leading-[1.15] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.25rem]">
            Technology worth
            <br />
            <span className="text-brand-700">keeping around.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
            A tightly curated catalogue of {totals?.products ?? 0} products from Apple, Samsung, boAt
            and Noise. Every item is tested by our team before it goes on sale — and returnable free
            for 30 days if it is not right.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to="/shop" size="lg">
              Shop all products
              <ArrowRight className="size-4" />
            </Button>
            <Button as={Link} to="/shop?sort=discount" variant="outline" size="lg">
              Browse today&apos;s deals
            </Button>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-200 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <stat.icon className="size-3.5 text-brand-600" aria-hidden="true" />
                  {stat.label}
                </dt>
                <dd className="mt-1 text-xl font-medium tracking-tight text-ink-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mx-auto w-full max-w-lg lg:max-w-none">
          {!primary ? (
            <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-4">
              <Skeleton className="row-span-2 h-[26rem] rounded-lg" />
              <Skeleton className="h-[12.5rem] rounded-lg" />
              <Skeleton className="h-[12.5rem] rounded-lg" />
              <Skeleton className="col-span-2 h-[5.5rem] rounded-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-4">
              <Paper
                component={Link}
                to={`/product/${primary.slug}`}
                elevation={2}
                className="group row-span-2 flex flex-col overflow-hidden animate-fade-up"
                sx={{
                  borderRadius: 1,
                  textDecoration: 'none',
                  transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { boxShadow: 8 },
                }}
              >
                <img
                  src={primary.image}
                  alt={primary.name}
                  className="aspect-square w-full bg-white object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-brand-700">
                    {primary.brand}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-ink-900">
                    {primary.name}
                  </p>
                  <div className="mt-auto pt-2.5">
                    <Rating value={primary.rating} reviewCount={primary.reviewCount} size="xs" />
                    <p className="mt-1.5 text-lg font-medium text-ink-900">
                      {formatPrice(primary.price)}
                    </p>
                  </div>
                </div>
              </Paper>

              {[secondary, tertiary].filter(Boolean).map((item, index) => (
                <Paper
                  key={item.id}
                  component={Link}
                  to={`/product/${item.slug}`}
                  elevation={2}
                  className="group flex overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${(index + 1) * 120}ms` }}
                  sx={{
                    borderRadius: 1,
                    textDecoration: 'none',
                    transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { boxShadow: 8 },
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-[6.5rem] shrink-0 bg-white object-contain p-2.5 transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="flex min-w-0 flex-1 flex-col justify-center p-3.5">
                    <span className="text-[0.625rem] font-medium uppercase tracking-wider text-brand-700">
                      {item.brand}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-ink-900">
                      {item.name}
                    </span>
                    <Rating value={item.rating} showValue={false} size="xs" className="mt-1.5" />
                    <span className="mt-1.5 text-sm font-medium text-ink-900">
                      {formatPrice(item.price)}
                    </span>
                  </span>
                </Paper>
              ))}

              <Paper elevation={1} className="col-span-2 flex items-center gap-4 p-4" sx={{ borderRadius: 1 }}>
                <span className="shrink-0">
                  <span className="block text-[0.6875rem] font-medium uppercase tracking-wider text-ink-500">
                    Rated this week
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <Rating value={4.8} showValue={false} size="sm" />
                    <span className="text-sm font-medium text-ink-900">4.8</span>
                  </span>
                </span>
                <span className="h-9 w-px shrink-0 bg-ink-200" aria-hidden="true" />
                <span className="text-xs leading-relaxed text-ink-600">
                  From <span className="font-medium text-ink-800">12,400</span> verified reviews across
                  the catalogue
                </span>
              </Paper>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
