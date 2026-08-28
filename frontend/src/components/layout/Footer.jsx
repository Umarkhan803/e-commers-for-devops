import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CreditCard,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Twitter,
  Youtube,
} from 'lucide-react'
import Button from '../ui/Button'
import { useToast } from '../../context/ToastContext'
import { useCatalog } from '../../context/CatalogContext'

const LINK_COLUMNS = [
  {
    title: 'Support',
    links: [
      'Help centre',
      'Track your order',
      'Shipping & delivery',
      'Returns & refunds',
      'Warranty claims',
      'Contact us',
    ],
  },
  {
    title: 'Company',
    links: ['About Nova', 'Careers', 'Press kit', 'Sustainability', 'Affiliates', 'Store locator'],
  },
  {
    title: 'Policies',
    links: [
      'Terms of service',
      'Privacy policy',
      'Cookie policy',
      'Accessibility statement',
      'Price match promise',
      'Fraud protection',
    ],
  },
]

const SOCIALS = [
  { label: 'Instagram', icon: Instagram },
  { label: 'Twitter', icon: Twitter },
  { label: 'Facebook', icon: Facebook },
  { label: 'YouTube', icon: Youtube },
  { label: 'LinkedIn', icon: Linkedin },
]

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'Amex', 'UPI', 'PayPal', 'Apple Pay']

export default function Footer() {
  const { toast } = useToast()
  const { categories } = useCatalog()
  const [email, setEmail] = useState('')

  const subscribe = (event) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('Enter a valid email address', { tone: 'error' })
      return
    }
    toast('You are on the list', {
      description: 'Look out for early access to drops and member pricing.',
    })
    setEmail('')
  }

  return (
    <footer className="mt-16 bg-ink-900 text-ink-400">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-medium text-white sm:text-3xl">
              Get early access to drops and member pricing
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-400">
              One email a week with genuinely new arrivals and price drops on things you have
              browsed. Unsubscribe in a single click.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter" className="sr-only">
              Email address
            </label>
            <div className="relative flex-1">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500"
                aria-hidden="true"
              />
              <input
                id="newsletter"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-lg border border-white/20 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-ink-500 focus:border-brand-400 focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--color-brand-400)]"
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0">
              Subscribe
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Nova home">
            <span className="grid size-9 place-items-center rounded bg-brand-600">
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
            <span className="text-xl font-medium tracking-tight text-white">Nova.</span>
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
            A curated technology marketplace. We stock fewer products than the big retailers, and we
            test every one of them before it goes live.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
              <span>Level 12, Prestige Tower, Bengaluru 560001</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-brand-300" aria-hidden="true" />
              <a href="tel:+18005551234" className="transition hover:text-white">
                +1 (800) 555-1234
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-brand-300" aria-hidden="true" />
              <a href="mailto:support@nova.shop" className="transition hover:text-white">
                support@nova.shop
              </a>
            </li>
          </ul>

          <div className="mt-6 flex gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                onClick={(event) => event.preventDefault()}
                className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-ink-300 transition hover:border-brand-400/50 hover:bg-brand-500/20 hover:text-white"
              >
                <social.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link
                  to={`/shop?category=${category.slug}`}
                  className="transition hover:text-white hover:underline hover:underline-offset-4"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {LINK_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-medium uppercase tracking-wider text-white">{column.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className="transition hover:text-white hover:underline hover:underline-offset-4"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-500">
            © {new Date().getFullYear()} Nova Commerce Ltd. All rights reserved. Prices include GST
            where applicable.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-ink-400">
              <ShieldCheck className="size-4 text-emerald-400" aria-hidden="true" />
              Secure checkout
            </span>
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span className="flex items-center gap-1.5 text-ink-500">
              <CreditCard className="size-4" aria-hidden="true" />
              {PAYMENT_METHODS.join(' · ')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
