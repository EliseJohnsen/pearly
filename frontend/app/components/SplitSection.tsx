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
      <div className="max-w-6xl mx-auto px-4 py-7 md:py-14">
      <div className={`flex flex-col ${imageRight ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        {/* Image — only rendered if imageSrc exists */}
        {imageSrc && (
          <div className="w-full md:w-1/2 aspect-[4/3] relative rounded-lg overflow-hidden">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              style={{ objectPosition }}
            />
          </div>
        )}

        {/* Text */}
        <div className={`flex items-center pt-8 pb-2 md:py-12 ${imageSrc ? 'w-full md:w-1/2 px-8 md:px-16 lg:px-20' : 'w-full'}`}>
          <div className={imageSrc ? 'max-w-lg' : 'max-w-2xl'}>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-app-primary leading-none">
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
