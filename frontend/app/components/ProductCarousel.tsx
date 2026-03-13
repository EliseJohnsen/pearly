'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const [arrowTop, setArrowTop] = useState(206)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    const updateArrowTop = () => {
      const container = scrollRef.current?.parentElement as HTMLElement
      const card = scrollRef.current?.querySelector('[class*="flex-shrink-0"]') as HTMLElement
      if (!card || !container) return
      const imgContainer = card.querySelector('img')?.parentElement as HTMLElement
      if (!imgContainer) return
      const containerTop = container.getBoundingClientRect().top
      const imgRect = imgContainer.getBoundingClientRect()
      setArrowTop(imgRect.top - containerTop + imgRect.height / 2)
    }
    updateArrowTop()
    window.addEventListener('resize', updateArrowTop)
    return () => window.removeEventListener('resize', updateArrowTop)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 30)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }
    const rafId = requestAnimationFrame(update)
    el.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.offsetWidth / 4
    scrollRef.current.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' })
  }

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        {heading && (
          <h2 className="text-2xl font-semibold text-dark-purple mb-6">
            {heading}
          </h2>
        )}
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute -left-6 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors"
              style={{ top: arrowTop }}
              aria-label="Forrige"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-900" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute -right-6 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors"
              style={{ top: arrowTop }}
              aria-label="Neste"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-900" />
            </button>
          )}
        <div ref={scrollRef} className="flex overflow-x-auto gap-2 md:gap-6 px-2 pb-4 snap-x snap-mandatory scrollbar-hide">
          {products.map((product) => (
            <div
              key={product._id}
              className="flex-shrink-0 w-[58vw] md:w-[calc(25%-1.125rem)] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
          {viewMoreLink?.href && (
            <div className="flex-shrink-0 w-[58vw] md:w-[calc(25%-1.125rem)] snap-start">
              <Link
                href={viewMoreLink.href}
                className="relative flex flex-col items-center justify-center aspect-[3/4] bg-primary-pink rounded-lg transition-all text-dark-purple gap-3 group overflow-hidden p-6"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors" />
                <ArrowRightIcon className="relative w-8 h-8 group-hover:translate-x-1 transition-transform" />
                <span className="relative text-lg font-semibold text-center">{viewMoreLink.text || 'Vis flere'}</span>
              </Link>
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  )
}
