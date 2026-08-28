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
              <Skeleton key={index} className="h-48 rounded-lg" />
            ))
          : categories.map((category, index) => (
            <Link
              key={category.slug}
              to={`/shop?category=${category.slug}`}
              className="group relative overflow-hidden rounded-lg bg-white p-5 shadow-soft transition-shadow duration-200 hover:shadow-lift"
            >
              <span
                className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-brand-100 opacity-70"
                aria-hidden="true"
              />
              <img
                src={productImage({
                  icon: category.icon,
                  palette: PALETTES[index % PALETTES.length],
                  seed: index + 3,
                })}
                alt=""
                className="relative size-16 rounded-lg border border-ink-200 object-cover"
              />
              <h3 className="relative mt-4 text-sm font-medium text-ink-900">{category.name}</h3>
              <p className="relative mt-0.5 text-xs text-ink-500">{category.blurb}</p>
              <p className="relative mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                {category.count} products
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
      </div>
    </section>
  )
}
