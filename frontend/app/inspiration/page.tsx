'use client'

import Image from 'next/image'
import Header from '../components/Header'
import {useInspiration} from '../hooks/useSanityData'
import {urlFor} from '@/lib/sanity'
import {useUIString} from '@/app/hooks/useSanityData'

export default function InspirationPage() {
  const {data: inspirations, loading} = useInspiration()
  const noInspirationsFoundText = useUIString('no_inspirations_found')
  const inspirationText = useUIString('inspiration')

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">{ inspirationText }</h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square w-full rounded-lg bg-gray-200"></div>
                  <div className="mt-4 h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : inspirations && inspirations.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
              {inspirations.map((item) => {
                const imageUrl = item.image?.asset?.url
                  ? urlFor(item.image).width(600).height(600).url()
                  : '/images/placeholder.png'

                return (
                  <a key={item._id} href={`/inspiration/${item.slug.current}`} className="group">
                    <div className="aspect-square w-full rounded-lg bg-gray-200 overflow-hidden">
                      <Image
                        alt={item.image?.alt || item.title}
                        src={imageUrl}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                      />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        {item.category && (
                          <span className="capitalize">{item.category}</span>
                        )}
                        {item.difficulty && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{item.difficulty}</span>
                          </>
                        )}
                        {item.colors && (
                          <>
                            <span>•</span>
                            <span>{item.colors} colors</span>
                          </>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{ noInspirationsFoundText }</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
