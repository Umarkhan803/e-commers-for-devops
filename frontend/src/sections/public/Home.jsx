import { useState } from 'react'
import Hero from './Hero'
import TrustBar from './TrustBar'
import CategoryRail from './CategoryRail'
import DealsSection from './DealsSection'
import FeaturedTabs from './FeaturedTabs'
import { BrandStrip, PromoSplit, Testimonials } from './PromoSplit'
import QuickViewModal from '../../components/product/QuickViewModal'

/**
 * Public section entry point. Composes the marketing rails and hands a single
 * quick-view handler down to every product surface on the page.
 */
export default function Home() {
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  return (
    <>
      <Hero />
      <TrustBar />
      <CategoryRail />
      <DealsSection onQuickView={setQuickViewProduct} />
      <FeaturedTabs onQuickView={setQuickViewProduct} />
      <BrandStrip />
      <PromoSplit />
      <Testimonials />

      <QuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  )
}
