import {createClient} from 'next-sanity'

// Server-side client for data fetching
export const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qpdup7gv',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-16',
  useCdn: false,
  perspective: 'published',
})

// Helper function to fetch data on the server
export async function fetchSanityData<T>(query: string): Promise<T | null> {
  try {
    const data = await serverClient.fetch<T>(query)
    return data
  } catch (error) {
    console.error('Server-side Sanity fetch error:', error)
    return null
  }
}
