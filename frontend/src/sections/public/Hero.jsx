import { Link } from 'react-router-dom'
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

  // The three best-selling products stand in as the hero collage.
  const { data } = useAsyncData(
    (signal) => fetchProducts({ sort: 'popular', limit: 3 }, { signal }),
    [],
  )
  const [primary, secondary, tertiary] = data?.items ?? []

  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-white">
      <div className="gradient-mesh absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent"
        aria-hidden="true"
      />

      <div className="container-page relative grid gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-soft backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Winter drop is live · up to 40% off
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.5rem]">
            Technology worth
            <br />
            <span className="text-gradient">keeping around.</span>
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

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-200/70 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                  <stat.icon className="size-3.5 text-brand-500" aria-hidden="true" />
                  {stat.label}
                </dt>
                <dd className="mt-1 text-xl font-extrabold tracking-tight text-ink-900">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product collage — a grid so cards can never overlap as they reflow. */}
        <div className="mx-auto w-full max-w-lg lg:max-w-none">
          {!primary ? (
            <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-4">
              <Skeleton className="row-span-2 h-[26rem] rounded-[1.5rem]" />
              <Skeleton className="h-[12.5rem] rounded-[1.25rem]" />
              <Skeleton className="h-[12.5rem] rounded-[1.25rem]" />
              <Skeleton className="col-span-2 h-[5.5rem] rounded-[1.25rem]" />
            </div>
          ) : (
          <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-4">
            <Link
              to={`/product/${primary.slug}`}
              className="group row-span-2 flex flex-col overflow-hidden rounded-[1.5rem] border border-ink-100 bg-white shadow-lift transition-transform duration-500 hover:-translate-y-1.5 animate-fade-up"
            >
              <img
                src={primary.image}
                alt={primary.name}
                className="aspect-square w-full bg-white object-contain p-6 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="flex flex-1 flex-col p-4">
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-brand-600">
                  {primary.brand}
                </span>
                <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-ink-900">
                  {primary.name}
                </p>
                <div className="mt-auto pt-2.5">
                  <Rating value={primary.rating} reviewCount={primary.reviewCount} size="xs" />
                  <p className="mt-1.5 text-lg font-extrabold text-ink-900">
                    {formatPrice(primary.price)}
                  </p>
                </div>
              </div>
            </Link>

            {/* Images stretch to the row height so these tiles never look hollow. */}
            {[secondary, tertiary].filter(Boolean).map((item, index) => (
              <Link
                key={item.id}
                to={`/product/${item.slug}`}
                className="group flex overflow-hidden rounded-[1.25rem] border border-ink-100 bg-white shadow-lift transition-transform duration-500 hover:-translate-y-1.5 animate-fade-up"
                style={{ animationDelay: `${(index + 1) * 120}ms` }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-[6.5rem] shrink-0 bg-white object-contain p-2.5 transition-transform duration-700 group-hover:scale-105"
                />
                <span className="flex min-w-0 flex-1 flex-col justify-center p-3.5">
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider text-brand-600">
                    {item.brand}
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-ink-900">
                    {item.name}
                  </span>
                  <Rating value={item.rating} showValue={false} size="xs" className="mt-1.5" />
                  <span className="mt-1.5 text-sm font-extrabold text-ink-900">
                    {formatPrice(item.price)}
                  </span>
                </span>
              </Link>
            ))}

            <div className="col-span-2 flex items-center gap-4 rounded-[1.25rem] border border-ink-100 bg-white/90 p-4 shadow-soft backdrop-blur">
              <span className="shrink-0">
                <span className="block text-[0.6875rem] font-bold uppercase tracking-wider text-ink-400">
                  Rated this week
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <Rating value={4.8} showValue={false} size="sm" />
                  <span className="text-sm font-extrabold text-ink-900">4.8</span>
                </span>
              </span>
              <span className="h-9 w-px shrink-0 bg-ink-200" aria-hidden="true" />
              <span className="text-xs leading-relaxed text-ink-500">
                From <span className="font-bold text-ink-800">12,400</span> verified reviews across
                the catalogue
              </span>
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  )
}
