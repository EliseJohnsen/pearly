import {createClient} from 'next-sanity'
import {createImageUrlBuilder} from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qpdup7gv',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-16',
  useCdn: true, // Use CDN for better performance and caching
  perspective: 'published', // Only return published documents
})

// Helper function to generate image URLs from Sanity image objects
const builder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Revalidate time for cached data (in seconds)
export const REVALIDATE_TIME = 60 // Revalidate every 60 seconds
