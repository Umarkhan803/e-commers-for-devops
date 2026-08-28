import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Rating from '../ui/Rating'
import QuantityStepper from '../ui/QuantityStepper'
import { PriceTag } from '../ui/Misc'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { cn, discountPercent } from '../../lib/utils'

const PERKS = [
  { icon: Truck, label: 'Free 2-day delivery' },
  { icon: RotateCcw, label: '30-day free returns' },
  { icon: ShieldCheck, label: '2-year warranty' },
]

export default function QuickViewModal({ product, open, onClose }) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [color, setColor] = useState(null)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (open && product) {
      setQuantity(1)
      setColor(product.colors?.[0] ?? null)
      setActiveImage(0)
    }
  }, [open, product])

  if (!product) return null

  const percent = discountPercent(product.price, product.compareAt)

  const handleAdd = () => {
    addItem(product, { quantity, color, openDrawer: true })
    toast('Added to cart', { description: `${quantity} × ${product.name}` })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="relative bg-ink-50 p-5 sm:p-7">
          <div className="overflow-hidden rounded-lg bg-white shadow-soft">
            <img
              src={product.gallery[activeImage]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="mt-3 flex gap-2.5">
            {product.gallery.map((src, index) => (
              <button
                key={src.slice(-24) + index}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={activeImage === index}
                className={cn(
                  'size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition',
                  activeImage === index
                    ? 'border-brand-500 shadow-soft'
                    : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{product.brand}</Badge>
            {percent > 0 ? <Badge tone="sale">-{percent}% today</Badge> : null}
            {product.tags?.includes('new') ? <Badge tone="new">New</Badge> : null}
          </div>

          <h2 className="mt-3 text-2xl font-medium leading-tight text-ink-900">{product.name}</h2>

          <div className="mt-2.5">
            <Rating value={product.rating} reviewCount={product.reviewCount} size="md" />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-600">{product.shortDescription}</p>

          <div className="mt-5">
            <PriceTag price={product.price} compareAt={product.compareAt} size="lg" />
            <p className="mt-1 text-xs text-ink-400">
              Inclusive of all taxes · Delivered in {product.deliveryDays} business days
            </p>
          </div>

          {product.colors?.length > 1 ? (
            <div className="mt-5">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
                Finish: <span className="text-ink-900">{color}</span>
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                      color === option
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-ink-200 text-ink-600 hover:border-ink-300',
                    )}
                  >
                    {color === option ? <Check className="size-3" /> : null}
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.min(product.stock || 1, 10)} />
            <Button
              onClick={handleAdd}
              disabled={!product.inStock}
              className="flex-1 min-w-[10rem]"
              size="lg"
            >
              <ShoppingBag className="size-4" />
              {product.inStock ? 'Add to cart' : 'Out of stock'}
            </Button>
          </div>

          <Button
            as={Link}
            to={`/product/${product.slug}`}
            onClick={onClose}
            variant="ghost"
            className="mt-3 self-start"
            size="sm"
          >
            See full details and reviews
            <ArrowRight className="size-4" />
          </Button>

          <ul className="mt-6 grid gap-2.5 border-t border-ink-100 pt-5 sm:grid-cols-3">
            {PERKS.map((perk) => (
              <li key={perk.label} className="flex items-center gap-2 text-xs font-medium text-ink-600">
                <perk.icon className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                {perk.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
