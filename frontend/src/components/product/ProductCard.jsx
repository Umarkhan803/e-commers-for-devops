import { Link } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import { Eye, Heart, ShoppingBag, Truck, Zap } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Rating from '../ui/Rating'
import { PriceTag } from '../ui/Misc'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useToast } from '../../context/ToastContext'
import { cn, discountPercent } from '../../lib/utils'

function StockLine({ product }) {
  if (!product.inStock) {
    return <span className="text-xs font-medium text-rose-700">Out of stock</span>
  }
  if (product.lowStock) {
    return (
      <span className="text-xs font-medium text-amber-700">Only {product.stock} left in stock</span>
    )
  }
  return <span className="text-xs font-medium text-emerald-700">In stock</span>
}

/**
 * Catalogue tile. Used by the home rails, the shop grid and related-product
 * strips, so all product presentation stays consistent across sections.
 */
export default function ProductCard({ product, onQuickView, layout = 'grid', className, style }) {
  const { addItem, quantityOf } = useCart()
  const wishlist = useWishlist()
  const { toast } = useToast()

  const percent = discountPercent(product.price, product.compareAt)
  const inCart = quantityOf(product.id)
  const isList = layout === 'list'

  const handleAdd = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const result = await addItem(product, { openDrawer: true })
    if (result.ok) toast('Added to cart', { description: product.name, tone: 'success' })
    else toast('Could not add to cart', { description: result.message, tone: 'error' })
  }

  const handleWishlist = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const added = await wishlist.toggle(product)
    toast(added ? 'Saved to wishlist' : 'Removed from wishlist', {
      description: product.name,
      tone: 'info',
    })
  }

  const handleQuickView = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onQuickView?.(product)
  }

  return (
    <Paper
      component="article"
      elevation={1}
      style={style}
      className={cn('group relative flex overflow-hidden', isList ? 'flex-row' : 'flex-col', className)}
      sx={{
        borderRadius: 1,
        transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { boxShadow: 6 },
      }}
    >
      <Link
        to={`/product/${product.slug}`}
        className={cn(
          'relative block shrink-0 overflow-hidden bg-ink-50',
          isList ? 'w-40 sm:w-52' : 'aspect-square w-full',
        )}
        aria-label={product.name}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={cn(
            'size-full bg-white object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.04]',
            !product.inStock && 'opacity-60 saturate-50',
          )}
        />

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {percent > 0 ? <Badge tone="sale">-{percent}%</Badge> : null}
          {product.tags?.includes('new') ? (
            <Badge tone="new">New</Badge>
          ) : product.tags?.includes('bestseller') ? (
            <Badge tone="outline" icon={Zap} className="backdrop-blur">
              Bestseller
            </Badge>
          ) : null}
        </div>

        <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
          <IconButton
            size="small"
            onClick={handleWishlist}
            aria-label={wishlist.has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={wishlist.has(product.id)}
            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.100' } }}
          >
            <Heart
              className={cn('size-4', wishlist.has(product.id) && 'fill-rose-600 text-rose-600')}
            />
          </IconButton>
          {onQuickView ? (
            <IconButton
              size="small"
              onClick={handleQuickView}
              aria-label={`Quick view ${product.name}`}
              sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.100' } }}
            >
              <Eye className="size-4" />
            </IconButton>
          ) : null}
        </div>

        {product.freeShipping && product.inStock ? (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded bg-white/95 px-2 py-0.5 text-[0.6875rem] font-medium text-ink-700 shadow-soft">
            <Truck className="size-3" aria-hidden="true" />
            Free delivery
          </span>
        ) : null}
      </Link>

      <div className={cn('flex flex-1 flex-col p-4', isList && 'sm:p-5')}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-brand-700">
            {product.brand}
          </span>
          <span className="text-[0.6875rem] font-medium text-ink-500">{product.categoryName}</span>
        </div>

        <h3 className="mt-1.5 text-[0.9375rem] font-medium leading-snug text-ink-900">
          <Link to={`/product/${product.slug}`} className="hover:text-brand-700">
            <span className={cn(isList ? '' : 'line-clamp-2')}>{product.name}</span>
          </Link>
        </h3>

        <div className="mt-2">
          <Rating value={product.rating} reviewCount={product.reviewCount} />
        </div>

        {isList ? (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-600">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto pt-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <PriceTag price={product.price} compareAt={product.compareAt} showPercent={false} />
              <div className="mt-1">
                <StockLine product={product} />
              </div>
            </div>

            {isList ? null : (
              <Button
                size="icon-sm"
                variant={product.inStock ? 'primary' : 'outline'}
                onClick={handleAdd}
                disabled={!product.inStock}
                aria-label={`Add ${product.name} to cart`}
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                <ShoppingBag className="size-4" />
              </Button>
            )}
          </div>

          <div className={cn('mt-3.5 flex gap-2', isList ? '' : 'max-sm:hidden')}>
            <Button
              size="sm"
              variant={product.inStock ? 'primary' : 'outline'}
              onClick={handleAdd}
              disabled={!product.inStock}
              fullWidth={!isList}
            >
              <ShoppingBag className="size-4" />
              {product.inStock ? 'Add to cart' : 'Notify me'}
              {inCart > 0 ? (
                <span className="ml-0.5 rounded bg-white/25 px-1.5 text-[0.6875rem]">{inCart}</span>
              ) : null}
            </Button>
            {isList ? (
              <Button size="sm" variant="outline" as={Link} to={`/product/${product.slug}`}>
                View details
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Paper>
  )
}
