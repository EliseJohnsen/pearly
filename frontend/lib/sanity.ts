import {createClient} from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qpdup7gv',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-12-16',
  useCdn: true, // Set to false if you want to ensure fresh data
  perspective: 'published', // Only return published documents
})

// Helper function to generate image URLs from Sanity image objects
const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Revalidate time for cached data (in seconds)
export const REVALIDATE_TIME = 60 // Revalidate every 60 seconds
