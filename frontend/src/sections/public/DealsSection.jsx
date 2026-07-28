import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'
import ProductCard from '../../components/product/ProductCard'
import Button from '../../components/ui/Button'
import { ProductCardSkeleton } from '../../components/ui/Misc'
import { fetchProducts } from '../../api/products'
import { useAsyncData } from '../../hooks/useAsyncData'

function useCountdownToMidnight() {
  const [remaining, setRemaining] = useState(() => msUntilMidnight())

  useEffect(() => {
    const timer = setInterval(() => setRemaining(msUntilMidnight()), 1000)
    return () => clearInterval(timer)
  }, [])

  const totalSeconds = Math.max(Math.floor(remaining / 1000), 0)
  return {
    hours: String(Math.floor(totalSeconds / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
  }
}

function msUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

function TimeBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="grid min-w-[2.75rem] place-items-center rounded-xl bg-ink-950 px-2 py-1.5 font-display text-lg font-extrabold tabular-nums text-white">
        {value}
      </span>
      <span className="mt-1 text-[0.625rem] font-bold uppercase tracking-wider text-ink-400">
        {label}
      </span>
    </div>
  )
}

export default function DealsSection({ onQuickView }) {
  const countdown = useCountdownToMidnight()

  // Discounted, in-stock products ordered by the size of the price cut.
  const { data, isLoading } = useAsyncData(
    (signal) =>
      fetchProducts({ onSale: true, inStock: true, sort: 'discount', limit: 8 }, { signal }),
    [],
  )
  const deals = data?.items ?? []

  return (
    <section className="border-y border-ink-100 bg-gradient-to-b from-white to-ink-50/60 py-14 sm:py-16">
      <div className="container-page">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-700">
              <Flame className="size-3.5" aria-hidden="true" />
              Flash deals
            </p>
            <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
              Today&apos;s biggest price drops
            </h2>
            <p className="mt-2 max-w-xl text-[0.9375rem] text-ink-500">
              Discounts reset at midnight. Stock on flash deals is limited to what we have on hand.
            </p>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex gap-2">
              <TimeBlock value={countdown.hours} label="Hrs" />
              <TimeBlock value={countdown.minutes} label="Min" />
              <TimeBlock value={countdown.seconds} label="Sec" />
            </div>
            <Button as={Link} to="/shop?sort=discount" variant="outline" className="hidden sm:inline-flex">
              All deals
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Horizontal rail on small screens, grid from large up. */}
        <div className="mt-8 -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={index} className="w-64 shrink-0 lg:w-auto" />
              ))
            : deals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={onQuickView}
                  className="w-64 shrink-0 lg:w-auto"
                />
              ))}
        </div>

        <Button as={Link} to="/shop?sort=discount" variant="outline" fullWidth className="mt-4 sm:hidden">
          See all deals
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}
