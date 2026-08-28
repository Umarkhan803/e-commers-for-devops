import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  Check,
  ChevronRight,
  CreditCard,
  Heart,
  Loader2,
  MapPin,
  PackageX,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Rating from '../../components/ui/Rating'
import QuantityStepper from '../../components/ui/QuantityStepper'
import { EmptyState, PriceTag, SectionHeading } from '../../components/ui/Misc'
import ProductGrid from '../../components/product/ProductGrid'
import QuickViewModal from '../../components/product/QuickViewModal'
import { ReviewList, ReviewSummary } from '../../components/product/Reviews'
import { fetchProduct } from '../../api/products'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useToast } from '../../context/ToastContext'
import { cn, discountPercent, formatPrice } from '../../lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'specs', label: 'Specifications' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'shipping', label: 'Shipping & returns' },
]

function Gallery({ product }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(0)
  }, [product.id])

  return (
    <div className="lg:sticky lg:top-[10.5rem]">
      <div className="group relative overflow-hidden rounded-lg bg-white shadow-soft">
        <img
          src={product.gallery[active]}
          alt={product.name}
          className="aspect-square w-full bg-white object-contain p-8 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
          {discountPercent(product.price, product.compareAt) > 0 ? (
            <Badge tone="sale">-{discountPercent(product.price, product.compareAt)}%</Badge>
          ) : null}
          {product.tags?.includes('new') ? <Badge tone="new">New arrival</Badge> : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        {product.gallery.map((src, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`View image ${index + 1} of ${product.gallery.length}`}
            aria-current={active === index}
            className={cn(
              'overflow-hidden rounded-lg border-2 bg-white transition',
              active === index
                ? 'border-brand-500 shadow-soft'
                : 'border-ink-100 opacity-70 hover:opacity-100',
            )}
          >
            <img src={src} alt="" className="aspect-square w-full bg-white object-contain p-2" />
          </button>
        ))}
      </div>
    </div>
  )
}

function StockBanner({ product }) {
  if (!product.inStock) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
        <PackageX className="size-4 shrink-0 text-rose-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-rose-800">
          Out of stock — join the waitlist and we will email you the moment it lands.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5',
        product.lowStock
          ? 'border-amber-200 bg-amber-50'
          : 'border-emerald-200 bg-emerald-50',
      )}
    >
      <BadgeCheck
        className={cn(
          'size-4 shrink-0',
          product.lowStock ? 'text-amber-600' : 'text-emerald-600',
        )}
        aria-hidden="true"
      />
      <p
        className={cn(
          'text-sm font-semibold',
          product.lowStock ? 'text-amber-800' : 'text-emerald-800',
        )}
      >
        {product.lowStock
          ? `Only ${product.stock} left — order soon`
          : `In stock · ${product.stock} units ready to ship`}
      </p>
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const { toast } = useToast()

  // Detail, related products and reviews all arrive in one request.
  const { data: product, error, isLoading } = useAsyncData(
    (signal) => fetchProduct(slug, { signal }),
    [slug],
  )

  const [quantity, setQuantity] = useState(1)
  const [color, setColor] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setQuantity(1)
    setActiveTab('overview')
  }, [slug])

  useEffect(() => {
    setColor(product?.colors?.[0] ?? null)
  }, [product])

  if (isLoading) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-20">
        <div className="flex flex-col items-center gap-3 text-ink-500">
          <Loader2 className="size-6 animate-spin text-brand-500" aria-hidden="true" />
          <p className="text-sm font-medium">Loading product…</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={PackageX}
          title="We could not find that product"
          description={
            error?.status === 404
              ? 'The link may be out of date, or the product has been retired from the catalogue.'
              : (error?.message ?? 'Something went wrong loading this product.')
          }
          action={
            <Button as={Link} to="/shop">
              Back to the shop
            </Button>
          }
        />
      </div>
    )
  }

  const related = product.related.slice(0, 3)

  const addToCart = async ({ thenCheckout = false } = {}) => {
    const result = await addItem(product, { quantity, color, openDrawer: !thenCheckout })
    if (!result.ok) {
      toast('Could not add to cart', { description: result.message, tone: 'error' })
      return
    }
    if (thenCheckout) {
      navigate('/checkout')
      return
    }
    toast('Added to cart', { description: `${quantity} × ${product.name}` })
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast('Link copied to clipboard', { tone: 'info' })
    } catch {
      toast('Could not share this link', { tone: 'error' })
    }
  }

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page py-4">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
            <Link to="/" className="transition hover:text-brand-600">
              Home
            </Link>
            <ChevronRight className="size-3.5 text-ink-300" aria-hidden="true" />
            <Link to="/shop" className="transition hover:text-brand-600">
              Shop
            </Link>
            <ChevronRight className="size-3.5 text-ink-300" aria-hidden="true" />
            <Link
              to={`/shop?category=${product.category}`}
              className="transition hover:text-brand-600"
            >
              {product.categoryName}
            </Link>
            <ChevronRight className="size-3.5 text-ink-300" aria-hidden="true" />
            <span className="truncate font-semibold text-ink-800">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-page py-8 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Gallery product={product} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/shop?brand=${encodeURIComponent(product.brandSlug)}`}>
                <Badge tone="brand">{product.brand}</Badge>
              </Link>
              {product.tags?.includes('bestseller') ? (
                <Badge tone="warning">Bestseller in {product.categoryName}</Badge>
              ) : null}
            </div>

            <h1 className="mt-3 text-3xl font-medium leading-tight tracking-tight text-ink-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Rating value={product.rating} size="md" />
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews')
                  document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-sm font-semibold text-brand-700 underline underline-offset-4 transition hover:text-brand-800"
              >
                Read {product.reviewCount.toLocaleString()} reviews
              </button>
            </div>

            <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-600">
              {product.shortDescription}
            </p>

            <div className="mt-6 rounded-lg bg-white p-5 shadow-soft">
              <PriceTag price={product.price} compareAt={product.compareAt} size="lg" />
              <p className="mt-1.5 text-xs text-ink-500">
                Inclusive of all taxes · EMI from{' '}
                <span className="font-semibold text-ink-700">
                  {formatPrice(product.price / 12)}/month
                </span>{' '}
                for 12 months
              </p>

              <div className="mt-4">
                <StockBanner product={product} />
              </div>

              {product.colors?.length > 1 ? (
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-500">
                    Finish: <span className="text-ink-900">{color}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {product.colors.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setColor(option)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded border px-4 py-2 text-sm font-medium transition',
                          color === option
                            ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-[inset_0_0_0_1px_var(--color-brand-600)]'
                            : 'border-ink-300 text-ink-700 hover:border-ink-500',
                        )}
                      >
                        {color === option ? <Check className="size-3.5" /> : null}
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  max={Math.min(product.stock || 1, 10)}
                />
                <Button
                  size="lg"
                  onClick={() => addToCart()}
                  disabled={!product.inStock}
                  className="flex-1 min-w-[11rem]"
                >
                  <ShoppingBag className="size-4" />
                  {product.inStock ? 'Add to cart' : 'Notify me'}
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => addToCart({ thenCheckout: true })}
                  disabled={!product.inStock}
                  className="flex-1 min-w-[11rem]"
                >
                  <CreditCard className="size-4" />
                  Buy it now
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Save to wishlist"
                  onClick={async () => {
                    const added = await wishlist.toggle(product)
                    toast(added ? 'Saved to wishlist' : 'Removed from wishlist', { tone: 'info' })
                  }}
                >
                  <Heart
                    className={cn('size-4', wishlist.has(product.id) && 'fill-rose-500 text-rose-500')}
                  />
                </Button>
                <Button variant="outline" size="icon" aria-label="Share product" onClick={share}>
                  <Share2 className="size-4" />
                </Button>
              </div>

              <div className="mt-5 grid gap-2.5 border-t border-ink-100 pt-5 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-2 text-ink-600">
                  <Truck className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {product.freeShipping ? 'Free delivery' : 'Delivery from $9.99'} in{' '}
                  {product.deliveryDays} days
                </p>
                <p className="flex items-center gap-2 text-ink-600">
                  <RotateCcw className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  30-day free returns
                </p>
                <p className="flex items-center gap-2 text-ink-600">
                  <ShieldCheck className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {product.specs?.Warranty ?? '2 years'} warranty
                </p>
                <p className="flex items-center gap-2 text-ink-600">
                  <MapPin className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  Ships from Bengaluru hub
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-2.5">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detail tabs keep long-form content out of the buy box. */}
        <div id="product-tabs" className="mt-14 scroll-mt-40">
          <div
            role="tablist"
            aria-label="Product information"
            className="flex gap-1 overflow-x-auto border-b border-ink-200 no-scrollbar"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative shrink-0 px-4 py-3 text-sm font-semibold transition',
                  activeTab === tab.id
                    ? 'text-brand-700'
                    : 'text-ink-500 hover:text-ink-800',
                )}
              >
                {tab.label}
                {tab.id === 'reviews' ? (
                  <span className="ml-1.5 text-xs font-bold text-ink-400">
                    {product.reviewCount.toLocaleString()}
                  </span>
                ) : null}
                {activeTab === tab.id ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="py-8 animate-fade-in">
            {activeTab === 'overview' ? (
              <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <h2 className="text-lg font-medium text-ink-900">About this product</h2>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-600">
                    {product.description}
                  </p>
                  <h3 className="mt-7 text-base font-bold text-ink-900">In the box</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      product.name,
                      'USB-C charging cable',
                      'Quick start guide',
                      'Warranty card',
                    ].map((entry) => (
                      <li
                        key={entry}
                        className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-700"
                      >
                        <Check className="size-3.5 shrink-0 text-emerald-600" strokeWidth={3} />
                        <span className="truncate">{entry}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="surface-card p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-ink-500">
                    At a glance
                  </h3>
                  <dl className="mt-4 space-y-3.5">
                    {Object.entries(product.specs)
                      .slice(0, 5)
                      .map(([key, value]) => (
                        <div key={key} className="border-b border-dashed border-ink-100 pb-3 last:border-0">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                            {key}
                          </dt>
                          <dd className="mt-0.5 text-sm font-medium text-ink-800">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </div>
            ) : null}

            {activeTab === 'specs' ? (
              <div className="surface-card overflow-hidden">
                <table className="w-full text-sm">
                  <caption className="sr-only">Full technical specifications</caption>
                  <tbody>
                    {Object.entries(product.specs).map(([key, value], index) => (
                      <tr
                        key={key}
                        className={cn(
                          'border-b border-ink-100 last:border-0',
                          index % 2 === 1 && 'bg-ink-50/50',
                        )}
                      >
                        <th
                          scope="row"
                          className="w-2/5 px-5 py-3.5 text-left align-top font-semibold text-ink-500"
                        >
                          {key}
                        </th>
                        <td className="px-5 py-3.5 font-medium text-ink-900">{value}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-ink-100">
                      <th scope="row" className="px-5 py-3.5 text-left font-semibold text-ink-500">
                        Available finishes
                      </th>
                      <td className="px-5 py-3.5 font-medium text-ink-900">
                        {product.colors.join(', ')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {activeTab === 'reviews' ? (
              <div className="space-y-9">
                <div className="surface-card p-6 sm:p-8">
                  <ReviewSummary product={product} />
                </div>
                <div>
                  <h3 className="mb-4 text-base font-bold text-ink-900">
                    Most helpful reviews
                  </h3>
                  <ReviewList reviews={product.reviews} />
                </div>
              </div>
            ) : null}

            {activeTab === 'shipping' ? (
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  {
                    icon: Truck,
                    title: 'Delivery',
                    body: `Standard delivery arrives in 4–6 business days and is free above $250. Express (2 days) and overnight options are available at checkout. This item ships from our Bengaluru hub in ${product.deliveryDays} days.`,
                  },
                  {
                    icon: RotateCcw,
                    title: 'Returns',
                    body: 'You have 30 days from delivery to return anything for a full refund. We arrange courier collection from your address at no cost — no repackaging required.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Warranty',
                    body: `Covered by a ${product.specs?.Warranty ?? '2 year'} manufacturer warranty, handled by us rather than the brand. Nova Plus members get an extra year at no charge.`,
                  },
                ].map((card) => (
                  <div key={card.title} className="surface-card p-6">
                    <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <card.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-ink-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{card.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <section className="mt-10 border-t border-ink-100 pt-12">
          <SectionHeading
            eyebrow="You may also like"
            title={`More from ${product.categoryName}`}
            description="Frequently compared with this product by other shoppers."
          />
          <ProductGrid
            products={related}
            onQuickView={setQuickViewProduct}
            columns="sm:grid-cols-2 lg:grid-cols-3"
            className="mt-7"
          />
        </section>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  )
}
