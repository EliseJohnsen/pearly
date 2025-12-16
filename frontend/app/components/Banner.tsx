'use client'

import {useBanner} from '@/app/hooks/useSanityData'

export default function Banner() {
  const {data: banner, loading} = useBanner()

  // Don't render if no banner, loading, or not active
  if (loading || !banner || !banner.isActive) {
    return null
  }

  // Determine background color based on type or custom color
  const getBgColor = () => {
    if (banner.backgroundColor) {
      return banner.backgroundColor
    }

    switch (banner.type) {
      case 'warning':
        return '#FFA500'
      case 'success':
        return '#10B981'
      case 'promo':
        return '#F5B0DF'
      case 'info':
      default:
        return '#F5B0DF' // primary-dark-pink
    }
  }

  const content = (
    <div className="flex flex-auto items-center gap-x-4 gap-y-2">
      <p className="text-sm/6 text-color-primary-red font-bold">
        {banner.text}
      </p>
    </div>
  )

  return (
    <div
      className="relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-3"
      style={{backgroundColor: getBgColor()}}
    >
      {banner.link ? (
        <a
          href={banner.link.href}
          className="flex flex-auto items-center gap-x-4 gap-y-2 hover:opacity-90 transition-opacity"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}
