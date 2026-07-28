import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import QuantityStepper from '../ui/QuantityStepper'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { cn, formatPrice } from '../../lib/utils'

export default function CartLineItem({ item, compact = false, onNavigate }) {
  const { setQuantity, removeItem } = useCart()
  const { toast } = useToast()
  const product = item.product
  if (!product) return null

  const remove = () => {
    removeItem(item.lineId)
    toast('Removed from cart', { description: product.name, tone: 'info' })
  }

  return (
    <article
      className={cn(
        'flex gap-3.5 rounded-2xl border border-ink-100 bg-white p-3 transition hover:border-ink-200',
        compact ? '' : 'sm:gap-5 sm:p-4',
      )}
    >
      <Link
        to={`/product/${product.slug}`}
        onClick={onNavigate}
        className={cn(
          'shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50',
          compact ? 'size-20' : 'size-24 sm:size-28',
        )}
      >
        <img src={product.image} alt={product.name} className="size-full object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-brand-600">
              {product.brand}
            </p>
            <h3 className="mt-0.5 truncate text-sm font-bold text-ink-900">
              <Link to={`/product/${product.slug}`} onClick={onNavigate} className="hover:text-brand-700">
                {product.name}
              </Link>
            </h3>
            {item.color ? (
              <p className="mt-0.5 text-xs text-ink-500">Finish: {item.color}</p>
            ) : null}
            {product.lowStock ? (
              <p className="mt-1 text-[0.6875rem] font-semibold text-amber-600">
                Only {product.stock} left
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={remove}
            aria-label={`Remove ${product.name} from cart`}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <QuantityStepper
            value={item.quantity}
            onChange={(next) => setQuantity(item.lineId, next)}
            min={1}
            max={Math.min(product.stock || 1, 10)}
            size="sm"
          />
          <div className="text-right">
            <p className="text-sm font-bold text-ink-900">{formatPrice(item.lineTotal)}</p>
            {item.quantity > 1 ? (
              <p className="text-xs text-ink-400">{formatPrice(product.price)} each</p>
            ) : null}
            {item.lineSavings > 0 ? (
              <p className="text-xs font-semibold text-emerald-600">
                Saving {formatPrice(item.lineSavings)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
