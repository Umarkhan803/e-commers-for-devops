import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  X,
} from 'lucide-react'
import SearchBar from './SearchBar'
import Button from '../ui/Button'
import { useCatalog } from '../../context/CatalogContext'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { useBodyScrollLock } from '../../hooks/useOverlay'
import { cn } from '../../lib/utils'

const ANNOUNCEMENTS = [
  { icon: Truck, text: 'Free express delivery on orders over $250' },
  { icon: Sparkles, text: 'Use code NOVA10 for 10% off your first order' },
  { icon: Package, text: '30-day free returns on everything' },
]

function AnnouncementBar() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % ANNOUNCEMENTS.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const item = ANNOUNCEMENTS[index]

  return (
    <div className="bg-ink-950 text-white">
      <div className="container-page flex h-9 items-center justify-between gap-4 text-xs">
        <p key={index} className="flex items-center gap-2 font-medium animate-fade-in">
          <item.icon className="size-3.5 text-accent-400" aria-hidden="true" />
          {item.text}
        </p>
        <div className="hidden items-center gap-4 text-ink-300 sm:flex">
          <Link to="/shop?sort=discount" className="transition hover:text-white">
            Today&apos;s deals
          </Link>
          <span className="text-ink-700">|</span>
          <span>Ships to India</span>
        </div>
      </div>
    </div>
  )
}

function Logo({ onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="flex shrink-0 items-center gap-2.5"
      aria-label="Nova home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-[0_8px_18px_-8px_rgba(79,70,229,0.8)]">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M7 17V7l10 10V7"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight text-ink-900">
        Nova
        <span className="ml-0.5 text-brand-600">.</span>
      </span>
    </Link>
  )
}

function AccountMenu() {
  const { user, isAuthenticated, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Button as={Link} to="/login" variant="ghost" size="sm">
          Log in
        </Button>
        <Button as={Link} to="/signup" size="sm">
          Sign up
        </Button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-3 transition hover:border-brand-300 hover:shadow-soft"
      >
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
          {user.initials}
        </span>
        <span className="max-w-[7rem] truncate text-sm font-semibold text-ink-800">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] w-64 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop animate-scale-in"
        >
          <div className="border-b border-ink-100 bg-ink-50/60 px-4 py-3">
            <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-brand-100 px-2 py-0.5 text-[0.6875rem] font-bold text-brand-700">
              {user.tier}
            </span>
          </div>
          <div className="p-1.5">
            {[
              { label: 'Your orders', icon: Package, to: '/shop' },
              { label: 'Wishlist', icon: Heart, to: '/shop' },
              { label: 'Account settings', icon: User, to: '/shop' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              >
                <item.icon className="size-4 text-ink-400" />
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
                navigate('/')
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MobileMenu({ open, onClose }) {
  const { isAuthenticated, user, logout } = useAuth()
  const { categories } = useCatalog()
  useBodyScrollLock(open)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[65] lg:hidden">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-pop animate-slide-right">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <Logo onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full p-2 text-ink-400 transition hover:bg-ink-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isAuthenticated ? (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 p-3.5">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
                {user.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
                <p className="truncate text-xs text-ink-500">{user.tier}</p>
              </div>
            </div>
          ) : (
            <div className="mb-5 grid grid-cols-2 gap-2.5">
              <Button as={Link} to="/login" variant="outline" onClick={onClose}>
                Log in
              </Button>
              <Button as={Link} to="/signup" onClick={onClose}>
                Sign up
              </Button>
            </div>
          )}

          <p className="mb-2.5 text-[0.6875rem] font-bold uppercase tracking-wider text-ink-400">
            Shop by category
          </p>
          <nav className="space-y-1">
            <Link
              to="/shop"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-brand-50 hover:text-brand-700"
            >
              All products
              <ChevronRight className="size-4 text-ink-300" />
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/shop?category=${category.slug}`}
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <span>
                  {category.name}
                  <span className="block text-xs text-ink-400">{category.blurb}</span>
                </span>
                <ChevronRight className="size-4 text-ink-300" />
              </Link>
            ))}
          </nav>

          <p className="mb-2.5 mt-6 text-[0.6875rem] font-bold uppercase tracking-wider text-ink-400">
            Quick links
          </p>
          <nav className="space-y-1">
            {[
              { label: "Today's deals", to: '/shop?sort=discount' },
              { label: 'New arrivals', to: '/shop?sort=newest' },
              { label: 'Your cart', to: '/cart' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={onClose}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                logout()
                onClose()
              }}
              className="mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function Navbar() {
  const { totals, openDrawer } = useCart()
  const wishlist = useWishlist()
  const { categories } = useCatalog()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [elevated, setElevated] = useState(false)

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setMobileSearchOpen(false)
  }, [location.pathname])

  // "/" focuses search the way most storefronts and docs sites do.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      event.preventDefault()
      document.querySelector('#desktop-search input')?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50">
        <AnnouncementBar />

        <div
          className={cn(
            'border-b bg-white/85 backdrop-blur-xl transition-shadow duration-300',
            elevated ? 'border-ink-100 shadow-soft' : 'border-transparent',
          )}
        >
          <div className="container-page flex h-16 items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="-ml-2 rounded-xl p-2 text-ink-700 transition hover:bg-ink-100 lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <Logo />

            <div id="desktop-search" className="hidden flex-1 md:block">
              <SearchBar />
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((current) => !current)}
                aria-label="Search"
                className="rounded-xl p-2.5 text-ink-700 transition hover:bg-ink-100 md:hidden"
              >
                <Search className="size-5" />
              </button>

              <Link
                to="/shop"
                aria-label={`Wishlist, ${wishlist.count} saved`}
                className="relative hidden rounded-xl p-2.5 text-ink-700 transition hover:bg-ink-100 sm:block"
              >
                <Heart className="size-5" />
                {wishlist.count > 0 ? (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[0.625rem] font-bold text-white">
                    {wishlist.count}
                  </span>
                ) : null}
              </Link>

              <button
                type="button"
                onClick={openDrawer}
                aria-label={`Open cart, ${totals.itemCount} items`}
                className="relative rounded-xl p-2.5 text-ink-700 transition hover:bg-ink-100"
              >
                <ShoppingBag className="size-5" />
                {totals.itemCount > 0 ? (
                  <span className="absolute -right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[0.6875rem] font-bold text-white shadow-[0_2px_8px_rgba(79,70,229,0.5)] animate-scale-in">
                    {totals.itemCount}
                  </span>
                ) : null}
              </button>

              <span className="mx-1 hidden h-6 w-px bg-ink-200 lg:block" />
              <AccountMenu />
            </div>
          </div>

          {mobileSearchOpen ? (
            <div className="container-page pb-3 md:hidden">
              <SearchBar autoFocus onNavigate={() => setMobileSearchOpen(false)} />
            </div>
          ) : null}

          {/* Category rail — the primary browse entry point on desktop. */}
          <nav
            aria-label="Product categories"
            className="hidden border-t border-ink-100 lg:block"
          >
            <div className="container-page flex h-11 items-center gap-1 overflow-x-auto no-scrollbar">
              <NavLink
                to="/shop"
                end
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-ink-900 text-white'
                      : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
                  )
                }
              >
                All products
              </NavLink>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/shop?category=${category.slug}`}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
                >
                  {category.name}
                </Link>
              ))}
              <span className="mx-1 h-5 w-px shrink-0 bg-ink-200" />
              <Link
                to="/shop?sort=discount"
                className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Deals
              </Link>
              <Link
                to="/shop?sort=newest"
                className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
              >
                New arrivals
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
