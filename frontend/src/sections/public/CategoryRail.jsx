import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeading, Skeleton } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import { useCatalog } from '../../context/CatalogContext'
import { productImage } from '../../lib/productImage'

const PALETTES = ['indigo', 'violet', 'slate', 'sky', 'amber', 'rose', 'emerald', 'fuchsia']

export default function CategoryRail() {
  const { categories, isLoading } = useCatalog()

  return (
    <section className="container-page py-14 sm:py-16">
      <SectionHeading
        eyebrow="Browse the catalogue"
        title="Shop by category"
        description={`${categories.length || 'Several'} focused departments. Every product in them has been through our review process.`}
        action={
          <Button as={Link} to="/shop" variant="outline">
            View all products
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-48 rounded-[1.25rem]" />
            ))
          : categories.map((category, index) => (
            <Link
              key={category.slug}
              to={`/shop?category=${category.slug}`}
              className="group relative overflow-hidden rounded-[1.25rem] border border-ink-100 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
            >
              <span
                className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full opacity-70 blur-2xl transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(circle, rgba(99,102,241,0.28), rgba(14,165,233,0.05))',
                }}
                aria-hidden="true"
              />
              <img
                src={productImage({
                  icon: category.icon,
                  palette: PALETTES[index % PALETTES.length],
                  seed: index + 3,
                })}
                alt=""
                className="relative size-16 rounded-2xl border border-ink-100 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <h3 className="relative mt-4 text-sm font-bold text-ink-900">{category.name}</h3>
              <p className="relative mt-0.5 text-xs text-ink-500">{category.blurb}</p>
              <p className="relative mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600">
                {category.count} products
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
      </div>
    </section>
  )
}
