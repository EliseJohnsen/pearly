'use client'

import {useBanner} from '@/app/hooks/useSanityData'

interface BannerProps {
  data?: any
}

export default function Banner({ data }: BannerProps = {}) {
  const {data: fetchedBanner, loading} = useBanner()

  const banner = data || fetchedBanner

  if (!data && (loading || !banner)) {
    return null
  }

  if (!banner || !banner.isActive) {
    return null
  }

  const getBgColor = () => {
    if (banner.backgroundColor) {
      return banner.backgroundColor
    }
  }

  const content = (
    <div className="flex flex-auto items-center justify-center gap-x-4 gap-y-2">
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
