import { Link } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import { ArrowRight, BadgeCheck, Gift, Quote } from 'lucide-react'
import Button from '../../components/ui/Button'
import Rating from '../../components/ui/Rating'
import { useCatalog } from '../../context/CatalogContext'

const TESTIMONIALS = [
  {
    quote:
      'The product pages actually tell you what you need to know. I ordered a monitor on a Tuesday and it was on my desk Thursday morning.',
    author: 'Renu Balakrishnan',
    role: 'Product designer, Bengaluru',
    rating: 5,
  },
  {
    quote:
      'Returned a pair of headphones that did not fit well. No forms, no argument — a courier collected them the next day.',
    author: 'James Adeyemi',
    role: 'Sound engineer, Lagos',
    rating: 5,
  },
  {
    quote:
      'I have bought four things here now. The curation means I spend ten minutes choosing instead of two hours reading spec sheets.',
    author: 'Sofia Marchetti',
    role: 'Founder, Milan',
    rating: 4,
  },
]

export function BrandStrip() {
  const { brands } = useCatalog()

  return (
    <section className="border-y border-ink-200 bg-white py-9">
      <div className="container-page">
        <p className="text-center text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
          Stocking {brands.length} brands we would buy from ourselves
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              to={`/shop?brand=${encodeURIComponent(brand.slug)}`}
              className="text-lg font-medium tracking-tight text-ink-400 transition-colors hover:text-ink-800"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PromoSplit() {
  return (
    <section className="container-page py-14 sm:py-16">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Paper
          elevation={0}
          className="relative overflow-hidden p-8 text-white sm:p-12"
          sx={{ borderRadius: 1, bgcolor: 'primary.dark' }}
        >
          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Nova Plus membership
            </span>
            <h2 className="mt-5 text-3xl font-medium leading-tight sm:text-4xl">
              Free overnight delivery, all year, for $49
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-brand-100">
              Members get priority overnight shipping on every order, an extra year of warranty
              cover, and first access to limited drops before they go public.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                as={Link}
                to="/signup"
                size="lg"
                sx={{
                  bgcolor: 'common.white',
                  color: 'primary.dark',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                Join Nova Plus
                <ArrowRight className="size-4" />
              </Button>
              <Button
                as={Link}
                to="/shop"
                size="lg"
                variant="ghost"
                sx={{
                  color: 'common.white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'common.white' },
                }}
              >
                Keep browsing
              </Button>
            </div>
          </div>
        </Paper>

        <div className="flex flex-col gap-5">
          <Paper elevation={1} className="p-7" sx={{ borderRadius: 1 }}>
            <span className="grid size-11 place-items-center rounded-lg bg-white text-amber-800 shadow-soft">
              <Gift className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-xl font-medium text-ink-900">Gift cards, instantly</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              Delivered by email in seconds, valid for three years, and usable across the whole
              catalogue.
            </p>
            <Button as={Link} to="/shop" variant="outline" size="sm" className="mt-5">
              Buy a gift card
            </Button>
          </Paper>

          <Paper elevation={1} className="flex-1 p-7" sx={{ borderRadius: 1 }}>
            <Quote className="size-7 text-brand-200" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium leading-relaxed text-ink-700">
              “{TESTIMONIALS[0].quote}”
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-medium text-white">
                RB
              </span>
              <div>
                <p className="text-sm font-medium text-ink-900">{TESTIMONIALS[0].author}</p>
                <p className="text-xs text-ink-600">{TESTIMONIALS[0].role}</p>
              </div>
            </div>
          </Paper>
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section className="border-t border-ink-200 bg-white py-14 sm:py-16">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-700">
            Customer stories
          </p>
          <h2 className="mt-2 text-2xl font-medium text-ink-900 sm:text-3xl">
            12,400 reviews, and we read all of them
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <Paper
              key={testimonial.author}
              component="figure"
              elevation={1}
              className="flex flex-col p-6"
              sx={{
                borderRadius: 1,
                m: 0,
                transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { boxShadow: 6 },
              }}
            >
              <Rating value={testimonial.rating} showValue={false} size="md" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-700">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-ink-200 pt-4">
                <p className="text-sm font-medium text-ink-900">{testimonial.author}</p>
                <p className="text-xs text-ink-600">{testimonial.role}</p>
              </figcaption>
            </Paper>
          ))}
        </div>
      </div>
    </section>
  )
}
