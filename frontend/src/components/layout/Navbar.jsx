import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import MuiBadge from '@mui/material/Badge'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import {
  ChevronRight,
  Heart,
  LogOut,
  Menu as MenuIcon,
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
    <div className="bg-brand-800 text-white">
      <div className="container-page flex h-9 items-center justify-between gap-4 text-xs">
        <p key={index} className="flex items-center gap-2 font-medium animate-fade-in">
          <item.icon className="size-3.5 text-brand-200" aria-hidden="true" />
          {item.text}
        </p>
        <div className="hidden items-center gap-4 text-brand-100 sm:flex">
          <Link to="/shop?sort=discount" className="transition hover:text-white">
            Today&apos;s deals
          </Link>
          <span className="text-brand-400">|</span>
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
      <span className="grid size-9 place-items-center rounded bg-brand-600 text-white shadow-soft">
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
      <span className="text-xl font-medium tracking-tight text-ink-900">
        Nova
        <span className="ml-0.5 text-brand-600">.</span>
      </span>
    </Link>
  )
}

function AccountMenu() {
  const { user, isAuthenticated, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()
  const open = Boolean(anchorEl)

  if (!isAuthenticated) {
    return (
      <div className="hidden items-center gap-1 lg:flex">
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
    <div className="hidden lg:block">
      <button
        type="button"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white py-1 pl-1 pr-3 transition hover:border-brand-300 hover:bg-ink-50"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-xs font-medium text-white">
          {user.initials}
        </span>
        <span className="max-w-[7rem] truncate text-sm font-medium text-ink-800">
          {user.name.split(' ')[0]}
        </span>
      </button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { width: 256, mt: 1 } } }}
      >
        <div className="border-b border-ink-100 px-4 py-3">
          <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
          <p className="truncate text-xs text-ink-600">{user.email}</p>
          <span className="mt-2 inline-flex rounded bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-medium text-brand-800">
            {user.tier}
          </span>
        </div>
        {[
          { label: 'Your orders', icon: Package, to: '/shop' },
          { label: 'Wishlist', icon: Heart, to: '/shop' },
          { label: 'Account settings', icon: User, to: '/shop' },
        ].map((item) => (
          <MenuItem
            key={item.label}
            component={Link}
            to={item.to}
            onClick={() => setAnchorEl(null)}
          >
            <ListItemIcon>
              <item.icon className="size-4" />
            </ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            logout()
            setAnchorEl(null)
            navigate('/')
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <LogOut className="size-4 text-rose-600" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
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
      <div className="absolute inset-0 bg-ink-950/50 animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-pop animate-slide-right">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
          <Logo onClick={onClose} />
          <IconButton onClick={onClose} aria-label="Close menu" size="small">
            <X className="size-5" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isAuthenticated ? (
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-ink-50 p-3.5">
              <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-medium text-white">
                {user.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
                <p className="truncate text-xs text-ink-600">{user.tier}</p>
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

          <p className="mb-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-ink-600">
            Shop by category
          </p>
          <nav className="space-y-0.5">
            <Link
              to="/shop"
              onClick={onClose}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink-800 transition hover:bg-brand-50 hover:text-brand-800"
            >
              All products
              <ChevronRight className="size-4 text-ink-400" />
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/shop?category=${category.slug}`}
                onClick={onClose}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-800"
              >
                <span>
                  {category.name}
                  <span className="block text-xs font-normal text-ink-500">{category.blurb}</span>
                </span>
                <ChevronRight className="size-4 text-ink-400" />
              </Link>
            ))}
          </nav>

          <p className="mb-2.5 mt-6 text-[0.6875rem] font-medium uppercase tracking-wider text-ink-600">
            Quick links
          </p>
          <nav className="space-y-0.5">
            {[
              { label: "Today's deals", to: '/shop?sort=discount' },
              { label: 'New arrivals', to: '/shop?sort=newest' },
              { label: 'Your cart', to: '/cart' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={onClose}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
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
              className="mt-6 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
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

        <AppBar position="static" color="inherit" elevation={elevated ? 4 : 1}>
          <div className="container-page flex h-16 items-center gap-3 sm:gap-5">
            <IconButton
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              edge="start"
              sx={{ display: { lg: 'none' } }}
            >
              <MenuIcon className="size-5" />
            </IconButton>

            <Logo />

            <div id="desktop-search" className="hidden flex-1 md:block">
              <SearchBar />
            </div>

            <div className="ml-auto flex items-center gap-0.5">
              <IconButton
                onClick={() => setMobileSearchOpen((current) => !current)}
                aria-label="Search"
                sx={{ display: { md: 'none' } }}
              >
                <Search className="size-5" />
              </IconButton>

              <IconButton
                component={Link}
                to="/shop"
                aria-label={`Wishlist, ${wishlist.count} saved`}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <MuiBadge badgeContent={wishlist.count} color="error" max={99}>
                  <Heart className="size-5" />
                </MuiBadge>
              </IconButton>

              <IconButton onClick={openDrawer} aria-label={`Open cart, ${totals.itemCount} items`}>
                <MuiBadge badgeContent={totals.itemCount} color="primary" max={99}>
                  <ShoppingBag className="size-5" />
                </MuiBadge>
              </IconButton>

              <span className="mx-1 hidden h-6 w-px bg-ink-200 lg:block" />
              <AccountMenu />
            </div>
          </div>

          {mobileSearchOpen ? (
            <div className="container-page pb-3 md:hidden">
              <SearchBar autoFocus onNavigate={() => setMobileSearchOpen(false)} />
            </div>
          ) : null}

          <nav aria-label="Product categories" className="hidden border-t border-ink-200 lg:block">
            <div className="container-page flex h-12 items-center gap-1 overflow-x-auto no-scrollbar">
              <NavLink
                to="/shop"
                end
                className={({ isActive }) =>
                  cn(
                    'relative shrink-0 px-3 py-3 text-sm font-medium transition',
                    isActive
                      ? 'text-brand-700 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-brand-600'
                      : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                All products
              </NavLink>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/shop?category=${category.slug}`}
                  className="shrink-0 px-3 py-3 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                >
                  {category.name}
                </Link>
              ))}
              <span className="mx-1 h-5 w-px shrink-0 bg-ink-200" />
              <Link
                to="/shop?sort=discount"
                className="shrink-0 px-3 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              >
                Deals
              </Link>
              <Link
                to="/shop?sort=newest"
                className="shrink-0 px-3 py-3 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
              >
                New arrivals
              </Link>
            </div>
          </nav>
        </AppBar>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
