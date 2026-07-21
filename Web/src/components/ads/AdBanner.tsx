'use client'

import { useEffect, useState, useRef } from 'react'

type AdBannerProps = {
  slotType?: 'header' | 'bottom' | 'sidebar'
  slotId?: string
  style?: React.CSSProperties
  className?: string
  format?: 'auto' | 'fluid' | 'rectangle'
}

export default function AdBanner({ slotType = 'bottom', slotId, style, className = '', format = 'auto' }: AdBannerProps) {
  const [config, setConfig] = useState<{ clientId: string; slotId: string } | null>(null)
  const adRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    fetch('/api/adsense')
      .then(res => res.json())
      .then(data => {
        if (!data.clientId) return

        let targetSlot = slotId || ''
        if (!targetSlot) {
          if (slotType === 'header') targetSlot = data.headerSlotId
          else if (slotType === 'sidebar') targetSlot = data.sidebarSlotId
          else targetSlot = data.bottomSlotId
        }

        setConfig({
          clientId: data.clientId,
          slotId: targetSlot
        })
      })
      .catch(() => null)
  }, [slotId, slotType])

  useEffect(() => {
    if (config?.clientId && adRef.current && !pushedRef.current) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || []
        adsbygoogle.push({})
        pushedRef.current = true
      } catch (err) {
        console.warn('[AdSense] Push warning:', err)
      }
    }
  }, [config])

  if (!config?.clientId) {
    return null
  }

  return (
    <div className={`my-4 flex justify-center text-center overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className='adsbygoogle'
        style={style || { display: 'block', minWidth: '250px', minHeight: '90px' }}
        data-ad-client={config.clientId}
        data-ad-slot={config.slotId || undefined}
        data-ad-format={format}
        data-full-width-responsive='true'
      />
    </div>
  )
}
