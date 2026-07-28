import { Link } from 'react-router-dom'
import { ArrowLeft, Quote, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import Rating from '../../components/ui/Rating'

const BENEFITS = [
  { icon: Truck, text: 'Track every order and reorder in two taps' },
  { icon: Sparkles, text: 'Member-only pricing and early access to drops' },
  { icon: ShieldCheck, text: 'Warranty claims handled by us, not the brand' },
]

/**
 * Shared shell for the authentication section — brand storytelling on one side,
 * the form on the other, collapsing to a single column on small screens.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(at 20% 15%, rgba(99,102,241,0.45) 0px, transparent 55%), radial-gradient(at 80% 85%, rgba(14,165,233,0.35) 0px, transparent 55%)',
          }}
          aria-hidden="true"
        />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Nova home">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
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
            <span className="text-xl font-extrabold tracking-tight">Nova.</span>
          </Link>
        </div>

        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">
            The shopping account you will actually use
          </h2>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit.text} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-white/10 text-accent-400 backdrop-blur">
                  <benefit.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed text-ink-200">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <Quote className="size-6 text-brand-300" aria-hidden="true" />
          <blockquote className="mt-3 text-sm leading-relaxed text-ink-200">
            “Signed up for the free returns, stayed for the curation. It is the only tech shop I do
            not second-guess.”
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold">
              HO
            </span>
            <span>
              <span className="block text-sm font-bold">Hannah Okafor</span>
              <Rating value={5} size="xs" showValue={false} />
            </span>
          </figcaption>
        </figure>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-ink-50 px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-brand-600"
          >
            <ArrowLeft className="size-4" />
            Back to store
          </Link>

          <div className="surface-card p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>

          {footer ? <div className="mt-6 text-center text-sm text-ink-500">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}
