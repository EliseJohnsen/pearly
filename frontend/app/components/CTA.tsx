'use client'

import Image from 'next/image'
import {useHero} from '@/app/hooks/useSanityData'
import {urlFor} from '@/lib/sanity'

interface CTAProps {
  data?: any
}

export default function CTA({ data }: CTAProps = {}) {
  const {data: fetchedHero, loading} = useHero()

  // Use provided data if available, otherwise use fetched data
  const hero = data || fetchedHero

  // Fallback to hardcoded values while loading or if no data (only when not using provided data)
  if (!data && (loading || !hero)) {
    return (
      <div className="overflow-hidden bg-background">
        <div className="">
          <div className="lg:max-w-none">
            <div className="relative">
              <div className="absolute top-1/2 left-12 -translate-y-1/4 bg-primary-pink p-8 rounded-xl shadow-2xl max-w-md">
                <p className="text-5xl lg:text-7xl font-semibold tracking-tight text-primary-red leading-tight">
                  {loading ? 'Loading...' : 'Get your hands pearly'}
                </p>
              </div>
              <Image
                alt="beads"
                src="/images/unicorn.png"
                width={2432}
                height={1442}
                className="justify-self-end w-3/4 max-w-none shadow-xl ring-1 ring-gray-400/10"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Use Sanity image if available, otherwise fallback
  const imageSrc = hero.image?.asset?.url
    ? urlFor(hero.image).width(2432).height(1442).url()
    : '/images/unicorn.png'

  const imageAlt = hero.image?.alt || 'Hero image'

  const getImageWidth = () => {
    if (hero && hero.imageWidth) {
      return hero.imageWidth
    } else
      return '75%'
  }

  return (
    <div className="overflow-hidden bg-background">
      <div className="">
        <div className="lg:max-w-none">
          <div className="relative">
            <div className="absolute top-1/2 left-12 -translate-y-1/4 bg-primary-pink p-8 rounded-xl shadow-2xl max-w-md">
              <p className="text-5xl lg:text-7xl font-semibold tracking-tight text-primary-red leading-tight">
                {hero.heading}
              </p>
              {hero.subheading && (
                <p className="mt-4 text-lg text-gray-700">
                  {hero.subheading}
                </p>
              )}
              {hero.ctaButton && (
                <a
                  href={hero.ctaButton.href}
                  className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
                >
                  {hero.ctaButton.text}
                </a>
              )}
            </div>
            <Image
              alt={imageAlt}
              src={imageSrc}
              width={2432}
              height={1442}
              className="justify-self-end max-w-none shadow-xl"
              style={{ width: getImageWidth() }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
