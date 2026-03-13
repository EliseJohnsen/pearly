'use client'

import Image from 'next/image'
import {useHero} from '@/app/hooks/useSanityData'
import {urlFor} from '@/lib/sanity'

interface HeroForsideProps {
  data?: any
}

export default function HeroForside({ data }: HeroForsideProps = {}) {
  const {data: fetchedHero, loading} = useHero()

  const hero = data || fetchedHero

  if (!data && (loading || !hero)) {
    return null
  }

  const imageSrc = hero.image?.asset?.url
    ? urlFor(hero.image).url()
    : null

  const imageAlt = hero.image?.alt || 'Hero image'
  const hotspot = hero.image?.hotspot
  const objectPosition = hotspot
    ? `${hotspot.x * 100}% ${hotspot.y * 100}%`
    : 'center'

  return (
    <div className="relative w-full overflow-hidden bg-background" style={{ height: 'calc(100vw * 4 / 9 + 74px)' }}>
      {imageSrc &&
        <Image
          alt={imageAlt}
          src={imageSrc}
          fill
          className="object-cover"
          style={{ objectPosition }}
        />
      }
      <div className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, black, transparent)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--dark-purple), transparent)' }}
      />
      <div className="absolute bottom-14 left-0 right-0">
        <div className="max-w-[95rem] mx-auto px-4 lg:px-8">
          <div className="max-w-[620px]">
            <p className="font-playfair text-3xl md:text-5xl lg:text-9xl font-extrabold tracking-tight text-white leading-tight">
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
