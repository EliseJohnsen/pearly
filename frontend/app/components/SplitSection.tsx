'use client'

import Image from 'next/image'
import Link from 'next/link'
import PearlyButton from './PearlyButton'

interface SplitSectionProps {
  data: {
    heading: string
    body?: string
    button?: { text: string; href: string }
    image?: { asset?: { url?: string }; alt?: string; hotspot?: { x: number; y: number } }
    imagePosition?: 'left' | 'right'
    backgroundColor?: string
    isActive?: boolean
  }
}

export default function SplitSection({ data }: SplitSectionProps) {
  if (data.isActive === false) return null

  const imageSrc = data.image?.asset?.url ?? null
  const imageAlt = data.image?.alt || ''
  const hotspot = data.image?.hotspot
  const objectPosition = hotspot ? `${hotspot.x * 100}% ${hotspot.y * 100}%` : 'center'
  const imageRight = data.imagePosition === 'right'

  return (
    <section
      className="w-full"
      style={{ backgroundColor: data.backgroundColor || 'var(--background)' }}
    >
      <div className="max-w-7xl mx-auto px-4">
      <div className={`flex flex-col ${imageRight ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        {/* Image — full width on mobile, 50% on desktop */}
        <div className="w-full md:w-1/2 aspect-[4/3] relative rounded-lg overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <div className="w-full h-full bg-primary-light" />
          )}
        </div>

        {/* Text */}
        <div className="w-full md:w-1/2 flex items-center px-8 pt-8 pb-2 md:py-12 md:px-16 lg:px-20">
          <div className="max-w-lg">
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-app-primary leading-tight">
              {data.heading}
            </h2>
            {data.body && (
              <p className="mt-6 text-base md:text-lg text-app-secondary leading-relaxed">
                {data.body}
              </p>
            )}
            {data.button?.text && data.button?.href && (
              <Link href={data.button.href}>
                <PearlyButton skin="outline" className="mt-6 mb-0">{data.button.text}</PearlyButton>
              </Link>
            )}
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}
