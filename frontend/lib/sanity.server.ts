import {createClient} from 'next-sanity'
import {draftMode} from 'next/headers'

// Server-side client for data fetching
export const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qpdup7gv',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-16',
  useCdn: false,
  perspective: 'published',
})

// Client for draft mode with stega encoding
export async function getClient() {
  const {isEnabled} = await draftMode()

  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qpdup7gv',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-12-16',
    useCdn: false,
    perspective: isEnabled ? 'previewDrafts' : 'published',
    stega: {
      enabled: isEnabled,
      studioUrl: '/studio',
    },
  })
}

// Helper function to fetch data on the server
export async function fetchSanityData<T>(query: string): Promise<T | null> {
  try {
    const client = await getClient()
    const data = await client.fetch<T>(query)
    return data
  } catch (error) {
    console.error('Server-side Sanity fetch error:', error)
    return null
  }
}
