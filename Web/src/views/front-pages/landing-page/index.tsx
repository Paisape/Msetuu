'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import HeroSection from './HeroSection'
import ShopByPurpose from './ShopByPurpose'
import ChadhavaSection from './ChadhavaSection'
import EPujaSection from './EPujaSection'
import MantraSection from './MantraSection'
import BestSellers from './BestSellers'
import CustomerReviews from './CustomerReviews'
import Faqs from './Faqs'
import { useSettings } from '@core/hooks/useSettings'

const LandingPageWrapper = ({ mode }: { mode: SystemMode }) => {
  const { updatePageSettings } = useSettings()

  useEffect(() => {
    return updatePageSettings({ skin: 'default' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='galaxy-bg stars-overlay min-h-screen'>
      {/* Banner */}
      <HeroSection />
      
      {/* Section 1: Shop by Purpose */}
      <ShopByPurpose />

      {/* Section 2: Chadhava */}
      <ChadhavaSection />

      {/* Section 3: Best Sellers */}
      <BestSellers />

      {/* Section 4: E-Puja Offerings */}
      <EPujaSection />

      {/* Section 4.5: Divine Mantras */}
      <MantraSection />

      {/* Section 5: Reviews */}
      <CustomerReviews />

      {/* Section 6: FAQ */}
      <Faqs />
    </div>
  )
}

export default LandingPageWrapper
