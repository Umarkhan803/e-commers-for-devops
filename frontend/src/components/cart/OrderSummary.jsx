import { useState } from 'react'
import { BadgePercent, Lock, Tag, Truck, X } from 'lucide-react'
import Button from '../ui/Button'
import { useCart, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { cn, formatPrice } from '../../lib/utils'

function Row({ label, value, tone = 'default', hint }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className={cn('text-ink-600', tone === 'total' && 'font-bold text-ink-900')}>
        {label}
        {hint ? <span className="block text-xs text-ink-400">{hint}</span> : null}
      </span>
      <span
        className={cn(
          'shrink-0 font-semibold tabular-nums text-ink-900',
          tone === 'positive' && 'text-emerald-600',
          tone === 'total' && 'text-lg font-extrabold',
        )}
      >
        {value}
      </span>
    </div>
  )
}

/** Free-shipping progress meter — a proven nudge toward a larger basket. */
export function FreeShippingMeter({ className }) {
  const { totals } = useCart()
  if (totals.itemCount === 0) return null

  const progress = Math.min(
    ((FREE_SHIPPING_THRESHOLD - totals.amountToFreeShipping) / FREE_SHIPPING_THRESHOLD) * 100,
    100,
  )

  return (
    <div className={cn('rounded-2xl border border-ink-100 bg-white p-3.5', className)}>
      <p className="flex items-center gap-2 text-xs font-semibold text-ink-700">
        <Truck className="size-4 text-brand-600" aria-hidden="true" />
        {totals.amountToFreeShipping > 0 ? (
          <>
            Add{' '}
            <span className="font-bold text-brand-700">
              {formatPrice(totals.amountToFreeShipping)}
            </span>{' '}
            more for free standard delivery
          </>
        ) : (
          <span className="font-bold text-emerald-600">
            You have unlocked free standard delivery
          </span>
        )}
      </p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function PromoInput({ className }) {
  const { promo, applyPromo, removePromo } = useCart()
  const { toast } = useToast()
  const [code, setCode] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!code.trim()) return
    const result = await applyPromo(code)
    toast(result.message ?? (result.ok ? 'Promo applied.' : 'Could not apply promo'), {
      tone: result.ok ? 'success' : 'error',
    })
    if (result.ok) setCode('')
  }

  if (promo) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <BadgePercent className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block font-bold text-emerald-800">{promo.code}</span>
            <span className="block truncate text-xs text-emerald-700">{promo.label}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={removePromo}
          aria-label="Remove promo code"
          className="shrink-0 rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-100"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Tag
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Promo code"
          aria-label="Promo code"
          className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-3 text-sm uppercase placeholder:normal-case placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
        />
      </div>
      <Button type="submit" variant="outline" className="shrink-0">
        Apply
      </Button>
    </form>
  )
}

/**
 * Shared totals block. `variant` switches between the cart page (with promo
 * entry) and the checkout rail (read-only, denser).
 */
export default function OrderSummary({
  action,
  variant = 'cart',
  showPromo = true,
  showMeter = true,
  className,
}) {
  const { totals, items, shippingMethod, promo } = useCart()

  return (
    <div className={cn('surface-card overflow-hidden', className)}>
      <div className="border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-extrabold text-ink-900">Order summary</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
          {variant === 'checkout' ? ` · ${shippingMethod.label} delivery` : ''}
        </p>
      </div>

      {variant === 'checkout' ? (
        <ul className="max-h-64 divide-y divide-ink-100 overflow-y-auto px-5">
          {items.map((item) => (
            <li key={item.lineId} className="flex items-center gap-3 py-3">
              <img
                src={item.product.image}
                alt=""
                className="size-12 shrink-0 rounded-lg border border-ink-100 object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink-900">
                  {item.product.name}
                </span>
                <span className="block text-xs text-ink-400">
                  Qty {item.quantity}
                  {item.color ? ` · ${item.color}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-ink-900">
                {formatPrice(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-3 px-5 py-4">
        {showPromo && variant === 'cart' ? <PromoInput className="mb-4" /> : null}

        <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
        {totals.savings > 0 ? (
          <Row label="Product savings" value={`− ${formatPrice(totals.savings)}`} tone="positive" />
        ) : null}
        {totals.discount > 0 ? (
          <Row
            label="Promo discount"
            hint={promo ? `Code ${promo.code}` : undefined}
            value={`− ${formatPrice(totals.discount)}`}
            tone="positive"
          />
        ) : null}
        <Row
          label="Shipping"
          hint={variant === 'cart' ? 'Choose a speed at checkout' : shippingMethod.detail}
          value={
            totals.shipping === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              formatPrice(totals.shipping)
            )
          }
        />
        <Row
          label="Estimated tax"
          hint={`${(TAX_RATE * 100).toFixed(2)}% sales tax`}
          value={formatPrice(totals.tax)}
        />

        <div className="border-t border-dashed border-ink-200 pt-3.5">
          <Row label="Total" value={formatPrice(totals.total)} tone="total" />
        </div>

        {showMeter ? <FreeShippingMeter className="mt-1" /> : null}

        {action ? <div className="pt-1">{action}</div> : null}

        <p className="flex items-center justify-center gap-1.5 pt-1 text-[0.6875rem] text-ink-400">
          <Lock className="size-3" aria-hidden="true" />
          Encrypted payment · PCI DSS compliant
        </p>
      </div>
    </div>
  )
}
