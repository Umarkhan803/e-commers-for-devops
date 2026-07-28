import { Headset, RotateCcw, ShieldCheck, Truck } from 'lucide-react'

const PERKS = [
  {
    icon: Truck,
    title: 'Free 2-day delivery',
    detail: 'On every order above $250, everywhere we ship.',
  },
  {
    icon: RotateCcw,
    title: '30-day free returns',
    detail: 'Changed your mind? We collect it from your door.',
  },
  {
    icon: ShieldCheck,
    title: '2-year warranty',
    detail: 'Extended cover included on all electronics.',
  },
  {
    icon: Headset,
    title: 'Real human support',
    detail: 'Average first reply in under 40 minutes.',
  },
]

export default function TrustBar() {
  return (
    <section className="border-b border-ink-100 bg-white">
      <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map((perk) => (
          <div key={perk.title} className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
              <perk.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink-900">{perk.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{perk.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
