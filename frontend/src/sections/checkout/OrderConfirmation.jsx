import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  Package,
  PackageSearch,
  Truck,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import { EmptyState, Skeleton } from '../../components/ui/Misc'
import { useToast } from '../../context/ToastContext'
import { PAYMENT_METHODS } from '../../components/checkout/CheckoutForms'
import { SHIPPING_METHODS } from '../../context/CartContext'
import { fetchOrder } from '../../api/account'
import { assetUrl } from '../../api/client'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatPrice } from '../../lib/utils'

const TIMELINE = [
  { icon: CheckCircle2, label: 'Order confirmed', detail: 'Just now', done: true },
  { icon: Package, label: 'Packed at our hub', detail: 'Within 24 hours', done: false },
  { icon: Truck, label: 'Out for delivery', detail: 'Tracking link by email', done: false },
  { icon: MapPin, label: 'Delivered', detail: 'Signature not required', done: false },
]

export default function OrderConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [params] = useSearchParams()

  const placed = location.state?.order
  const reference = placed?.reference ?? params.get('ref')
  const email = params.get('email') ?? undefined

  /**
   * Checkout hands the order over in route state. A direct visit or a refresh
   * loses that, so the reference is re-read from the API instead.
   */
  const { data: fetched, isLoading } = useAsyncData(
    (signal) => (placed || !reference ? Promise.resolve(null) : fetchOrder(reference, { email, signal })),
    [placed, reference, email],
  )

  const order = placed ?? fetched

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  if (!order && isLoading) {
    return (
      <div className="container-page space-y-4 py-16">
        <Skeleton className="mx-auto h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={PackageSearch}
          title="No recent order to show"
          description="Order confirmations are only shown right after checkout. Check your email for past receipts."
          action={
            <Button onClick={() => navigate('/shop')} size="lg">
              Back to the shop
            </Button>
          }
        />
      </div>
    )
  }

  const shipping =
    SHIPPING_METHODS.find((method) => method.id === order.shippingMethod) ?? SHIPPING_METHODS[0]

  const deliveryEstimate = new Date(
    order.estimatedDelivery ?? Date.now() + 5 * 86400000,
  ).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const paymentLabel =
    PAYMENT_METHODS.find((method) => method.id === order.paymentMethod)?.label ?? 'Card'

  const address = order.shippingAddress

  return (
    <div className="bg-ink-50">
      <div className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="gradient-mesh absolute inset-0" aria-hidden="true" />
        <div className="container-page relative py-14 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-lg bg-emerald-100 text-emerald-700 animate-scale-in">
            <CheckCircle2 className="size-9" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
            Thank you, {address.fullName.split(' ')[0]} — your order is confirmed
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-600">
            We have emailed a receipt to{' '}
            <span className="font-semibold text-ink-900">{order.email}</span>. You will get
            a tracking link as soon as the parcel leaves our hub.
          </p>

          <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-3 rounded-lg bg-white px-5 py-3.5 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Order reference
            </span>
            <span className="font-display text-lg font-medium tracking-tight text-ink-900">
              {order.reference}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(order.reference)
                toast('Order reference copied', { tone: 'info' })
              }}
              className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
              aria-label="Copy order reference"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="container-page py-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <section className="surface-card p-6">
              <h2 className="text-base font-medium text-ink-900">Delivery progress</h2>
              <ol className="mt-5 space-y-5">
                {TIMELINE.map((entry, index) => (
                  <li key={entry.label} className="relative flex gap-4">
                    {index < TIMELINE.length - 1 ? (
                      <span
                        className={
                          entry.done
                            ? 'absolute left-[1.1875rem] top-10 h-[calc(100%-0.5rem)] w-0.5 rounded-full bg-emerald-300'
                            : 'absolute left-[1.1875rem] top-10 h-[calc(100%-0.5rem)] w-0.5 rounded-full bg-ink-200'
                        }
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={
                        entry.done
                          ? 'relative grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white'
                          : 'relative grid size-10 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-400'
                      }
                    >
                      <entry.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="pt-1.5">
                      <span className="block text-sm font-bold text-ink-900">{entry.label}</span>
                      <span className="block text-xs text-ink-500">{entry.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                <p className="text-sm text-brand-900">
                  <span className="font-bold">Estimated delivery: {deliveryEstimate}</span>
                  <span className="block text-xs text-brand-700">
                    {shipping.label} · {shipping.detail}
                  </span>
                </p>
              </div>
            </section>

            <section className="surface-card overflow-hidden">
              <header className="border-b border-ink-100 px-6 py-4">
                <h2 className="text-base font-medium text-ink-900">
                  Items in this order ({order.items.length})
                </h2>
              </header>
              <ul className="divide-y divide-ink-100">
                {order.items.map((item) => (
                  <li key={`${item.slug}-${item.color}`} className="flex items-center gap-4 px-6 py-4">
                    <img
                      src={assetUrl(item.image)}
                      alt=""
                      className="size-16 shrink-0 rounded-xl border border-ink-100 bg-white object-contain p-1.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-brand-600">
                        {item.brand}
                      </p>
                      <p className="truncate text-sm font-bold text-ink-900">
                        <Link to={`/product/${item.slug}`} className="hover:text-brand-700">
                          {item.name}
                        </Link>
                      </p>
                      <p className="text-xs text-ink-500">
                        Qty {item.quantity}
                        {item.color ? ` · ${item.color}` : ''}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-ink-900">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <section className="surface-card p-6">
                <h2 className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  <MapPin className="size-4 text-brand-600" aria-hidden="true" />
                  Shipping to
                </h2>
                <div className="mt-3 space-y-0.5 text-sm text-ink-600">
                  <p className="font-bold text-ink-900">{address.fullName}</p>
                  <p>{address.line1}</p>
                  {address.line2 ? <p>{address.line2}</p> : null}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                  <p className="pt-2 text-ink-500">{address.phone}</p>
                </div>
              </section>

              <section className="surface-card p-6">
                <h2 className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  <Mail className="size-4 text-brand-600" aria-hidden="true" />
                  Payment
                </h2>
                <div className="mt-3 space-y-0.5 text-sm text-ink-600">
                  <p className="font-bold text-ink-900">{paymentLabel}</p>
                  {order.paymentMethod === 'card' && order.paymentLast4 ? (
                    <p>Card ending in {order.paymentLast4}</p>
                  ) : null}
                  <p className="pt-2 text-ink-500">
                    {order.paymentStatus === 'paid'
                      ? `Charged ${formatPrice(order.totals.total)}`
                      : `${formatPrice(order.totals.total)} due on delivery`}{' '}
                    ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </section>
            </div>
          </div>

          <div className="lg:sticky lg:top-[10.5rem] lg:self-start">
            <div className="surface-card overflow-hidden">
              <header className="border-b border-ink-100 px-5 py-4">
                <h2 className="text-base font-medium text-ink-900">Payment summary</h2>
              </header>
              <div className="space-y-3 px-5 py-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Subtotal</span>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(order.totals.subtotal)}
                  </span>
                </div>
                {order.totals.discount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-ink-600">Promo discount</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">
                      − {formatPrice(order.totals.discount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-ink-600">Shipping</span>
                  <span className="font-semibold tabular-nums">
                    {order.totals.shipping === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : (
                      formatPrice(order.totals.shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Tax</span>
                  <span className="font-semibold tabular-nums">{formatPrice(order.totals.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-ink-200 pt-3">
                  <span className="font-bold text-ink-900">Total paid</span>
                  <span className="text-lg font-medium tabular-nums text-ink-900">
                    {formatPrice(order.totals.total)}
                  </span>
                </div>

                {order.totals.savings > 0 ? (
                  <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-center text-xs font-semibold text-emerald-700">
                    You saved {formatPrice(order.totals.savings + order.totals.discount)} on this
                    order
                  </p>
                ) : null}

                <Button as={Link} to="/shop" size="lg" fullWidth className="mt-2">
                  Continue shopping
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => toast('A tracking link will arrive by email', { tone: 'info' })}
                >
                  Track this order
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
