'use client'

import Image from 'next/image'
import {useHero} from '@/app/hooks/useSanityData'
import {urlFor} from '@/lib/sanity'

interface CTAData {
  image?: {
    asset?: {
      url?: string;
    };
    alt?: string;
  };
  imageWidth?: string;
  heading?: string;
  subheading?: string;
  ctaButton?: {
    href: string;
    text: string;
  };
}

interface CTAProps {
  data?: CTAData;
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Use Sanity image if available, otherwise fallback
  const imageSrc = hero.image?.asset?.url
    ? urlFor(hero.image).url()
    : null

  const imageAlt = hero.image?.alt || 'Hero image'
  const hotspot = hero.image?.hotspot
  const objectPosition = hotspot
    ? `${hotspot.x * 100}% ${hotspot.y * 100}%`
    : 'center'

  const getImageWidth = () => {
    if (hero && hero.imageWidth) {
      return hero.imageWidth
    } else
      return '75%'
  }

  return (
    <div className="relative w-full aspect-[9/4] overflow-hidden bg-background">
      {imageSrc &&
        <Image
          alt={imageAlt}
          src={imageSrc}
          fill
          className="object-cover"
          style={{ objectPosition }}
        />
      }
      <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--dark-purple), transparent)' }}
      />
      <div className="absolute bottom-14 left-0 right-0">
      <div className="max-w-[95rem] mx-auto px-4 lg:px-8">
      <div className="max-w-[620px]">
        <p className="font-display text-3xl md:text-5xl lg:text-9xl text-white leading-none">
          {hero.heading}
        </p>
        {hero.subheading && (
          <p className="mt-4 text-lg text-white">
            {hero.subheading}
          </p>
        )}
      </div>
      </div>
      </div>
    </div>
  )
}
