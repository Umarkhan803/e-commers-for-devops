import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react'
import CartLineItem from '../../components/cart/CartLineItem'
import OrderSummary from '../../components/cart/OrderSummary'
import ProductGrid from '../../components/product/ProductGrid'
import QuickViewModal from '../../components/product/QuickViewModal'
import Button from '../../components/ui/Button'
import { EmptyState, SectionHeading } from '../../components/ui/Misc'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { fetchProducts } from '../../api/products'
import { useAsyncData } from '../../hooks/useAsyncData'

export default function CartPage() {
  const { items, totals, clearCart } = useCart()
  const { toast } = useToast()
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  const { data: suggested } = useAsyncData(
    (signal) =>
      fetchProducts({ inStock: true, minRating: 4.5, sort: 'popular', limit: 6 }, { signal }),
    [],
  )

  const recommendations = (suggested?.items ?? [])
    .filter((product) => !items.some((item) => item.product.id === product.id))
    .slice(0, 3)

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Once you add something it will show up here, along with delivery estimates and totals."
          action={
            <Button as={Link} to="/shop" size="lg">
              Browse the catalogue
              <ArrowRight className="size-4" />
            </Button>
          }
        />

        <section className="mt-16">
          <SectionHeading
            eyebrow="Popular right now"
            title="Top rated in the catalogue"
            description="A good place to start if you are not sure what you are after."
          />
          <ProductGrid
            products={recommendations}
            onQuickView={setQuickViewProduct}
            columns="sm:grid-cols-2 lg:grid-cols-3"
            className="mt-7"
          />
        </section>

        <QuickViewModal
          product={quickViewProduct}
          open={Boolean(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
        />
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page py-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-500">
            <Link to="/" className="transition hover:text-brand-600">
              Home
            </Link>
            <ChevronRight className="size-3.5 text-ink-300" aria-hidden="true" />
            <span className="font-semibold text-ink-800">Cart</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
                Your cart
              </h1>
              <p className="mt-1.5 text-sm text-ink-500">
                {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} · reserved for the
                next 60 minutes
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearCart()
                toast('Cart cleared', { tone: 'info' })
              }}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="size-4" />
              Empty cart
            </Button>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            {items.map((item) => (
              <CartLineItem key={item.lineId} item={item} />
            ))}

            <Button as={Link} to="/shop" variant="outline" className="mt-2">
              <ArrowLeft className="size-4" />
              Continue shopping
            </Button>
          </div>

          <div className="lg:sticky lg:top-[10.5rem] lg:self-start">
            <OrderSummary
              action={
                <Button as={Link} to="/checkout" size="lg" fullWidth>
                  Proceed to checkout
                  <ArrowRight className="size-4" />
                </Button>
              }
            />
          </div>
        </div>

        <section className="mt-16 border-t border-ink-100 pt-12">
          <SectionHeading
            eyebrow="Pairs well with"
            title="Frequently bought together"
            description="Based on what other shoppers added alongside these items."
          />
          <ProductGrid
            products={recommendations}
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
