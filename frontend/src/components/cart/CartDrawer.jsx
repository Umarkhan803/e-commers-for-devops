import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import Drawer from '../ui/Drawer'
import Button from '../ui/Button'
import CartLineItem from './CartLineItem'
import { FreeShippingMeter } from './OrderSummary'
import { EmptyState } from '../ui/Misc'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../lib/utils'

export default function CartDrawer() {
  const { items, totals, isDrawerOpen, closeDrawer } = useCart()
  const navigate = useNavigate()

  const goTo = (path) => {
    closeDrawer()
    navigate(path)
  }

  return (
    <Drawer
      open={isDrawerOpen}
      onClose={closeDrawer}
      title="Your cart"
      subtitle={
        totals.itemCount > 0
          ? `${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'} · ${formatPrice(totals.subtotal)}`
          : 'Nothing here yet'
      }
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Subtotal</span>
              <span className="font-bold text-ink-900">{formatPrice(totals.subtotal)}</span>
            </div>
            {totals.savings > 0 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-600">You save</span>
                <span className="font-semibold text-emerald-600">
                  − {formatPrice(totals.savings)}
                </span>
              </div>
            ) : null}
            <p className="text-xs text-ink-400">Shipping and taxes are calculated at checkout.</p>
            <Button fullWidth size="lg" onClick={() => goTo('/checkout')}>
              Checkout
              <ArrowRight className="size-4" />
            </Button>
            <Button fullWidth variant="outline" onClick={() => goTo('/cart')}>
              View full cart
            </Button>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the catalogue and add something you like — we will hold it here for you."
          action={
            <Button as={Link} to="/shop" onClick={closeDrawer}>
              Start shopping
            </Button>
          }
          className="border-none bg-transparent"
        />
      ) : (
        <div className="space-y-3">
          <FreeShippingMeter />
          {items.map((item) => (
            <CartLineItem key={item.lineId} item={item} compact onNavigate={closeDrawer} />
          ))}
        </div>
      )}
    </Drawer>
  )
}
