import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid size-16 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <Compass className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-6xl font-medium tracking-tight text-ink-900">404</p>
      <h1 className="mt-2 text-2xl font-medium text-ink-900">This page has moved on</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
        The link may be out of date. The catalogue, your cart and checkout are all still where you
        left them.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to="/" size="lg">
          <Home className="size-4" />
          Back to home
        </Button>
        <Button as={Link} to="/shop" variant="outline" size="lg">
          Browse products
        </Button>
      </div>
    </div>
  )
}
