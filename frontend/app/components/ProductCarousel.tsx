'use client'

import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import ProductCard from './ProductCard'

interface ProductImage {
  asset: { url: string }
  alt?: string
  isPrimary?: boolean
}

interface CarouselProduct {
  _id: string
  title: string
  slug: { current: string }
  price?: number
  images?: ProductImage[]
  image?: ProductImage
}

interface ProductCarouselProps {
  heading?: string
  products: CarouselProduct[]
  viewMoreLink?: {
    text?: string
    href?: string
  }
}

export default function ProductCarousel({ heading, products, viewMoreLink }: ProductCarouselProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        {heading && (
          <h2 className="text-2xl font-semibold text-dark-purple mb-6">
            {heading}
          </h2>
        )}
        <div className="flex overflow-x-auto gap-2 md:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex-shrink-0 w-[65vw] md:w-[calc(33.33%-1rem)] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
          {viewMoreLink?.href && (
            <div className="flex-shrink-0 w-[65vw] md:w-[calc(33.33%-1rem)] snap-start rounded-lg p-4">
              <Link
                href={viewMoreLink.href}
                className="flex flex-col items-center justify-center aspect-[3/4] bg-primary-pink rounded-lg hover:opacity-80 transition-all text-dark-purple gap-3 group"
              >
                <ArrowRightIcon className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                <span className="text-lg font-semibold">{viewMoreLink.text || 'Vis flere'}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
