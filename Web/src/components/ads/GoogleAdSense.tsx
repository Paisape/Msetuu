'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

type AdSenseConfig = {
  clientId: string
  autoAdsEnabled: boolean
  headerSlotId: string
  bottomSlotId: string
  sidebarSlotId: string
}

export default function GoogleAdSense() {
  const [config, setConfig] = useState<AdSenseConfig | null>(null)

  useEffect(() => {
    fetch('/api/adsense')
      .then(res => res.json())
      .then(data => {
        if (data.clientId) {
          setConfig(data)
        }
      })
      .catch(() => null)
  }, [])

  if (!config?.clientId) return null

  const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`

  return (
    <Script
      async
      src={scriptSrc}
      crossOrigin='anonymous'
      strategy='afterInteractive'
    />
  )
}
