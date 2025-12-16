'use client'

import {useEffect, useState} from 'react'
import {client} from '@/lib/sanity'
import {useLocale} from '@/app/contexts/LocaleContext'
import {
  navigationQuery,
  navigationByTypeQuery,
  heroQuery,
  bannerQuery,
  howItWorksQuery,
  uiStringsQuery,
  uiStringsByCategoryQuery,
  uiStringByKeyQuery,
  pageSettingsQuery,
  inspirationQuery,
  featuredInspirationQuery,
  inspirationBySlugQuery,
} from '@/lib/queries'
import type {
  Navigation,
  Hero,
  Banner,
  HowItWorks,
  UIString,
  PageSettings,
  Inspiration,
} from '@/types/sanity'

// Generic hook for fetching data
function useSanityQuery<T>(query: string, initialData: T | null = null) {
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    client
      .fetch<T>(query)
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err) => {
        console.error('Sanity fetch error:', err)
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [query])

  return {data, loading, error}
}

// Navigation hooks
export function useNavigation() {
  return useSanityQuery<Navigation[]>(navigationQuery)
}

export function useNavigationByType(type: 'main' | 'cta' | 'footer') {
  return useSanityQuery<Navigation[]>(navigationByTypeQuery(type))
}

// Hero/CTA hook
export function useHero() {
  return useSanityQuery<Hero>(heroQuery)
}

// Banner hook
export function useBanner() {
  return useSanityQuery<Banner>(bannerQuery)
}

// How It Works hook
export function useHowItWorks() {
  return useSanityQuery<HowItWorks>(howItWorksQuery)
}

// UI Strings hooks
export function useUIStrings() {
  const {locale} = useLocale()
  return useSanityQuery<UIString[]>(uiStringsQuery(locale))
}

export function useUIStringsByCategory(category: string) {
  const {locale} = useLocale()
  return useSanityQuery<UIString[]>(uiStringsByCategoryQuery(category, locale))
}

export function useUIString(key: string): string {
  const {locale} = useLocale()
  const {data, loading} = useSanityQuery<{value: string} | null>(
    uiStringByKeyQuery(key, locale)
  )

  // Return the value or the key as fallback
  if (loading || !data) return key
  return data.value || key
}

// Page Settings hook
export function usePageSettings(page: string = 'home') {
  return useSanityQuery<PageSettings>(pageSettingsQuery(page))
}

// Inspiration hooks
export function useInspiration() {
  return useSanityQuery<Inspiration[]>(inspirationQuery)
}

export function useFeaturedInspiration() {
  return useSanityQuery<Inspiration[]>(featuredInspirationQuery)
}

export function useInspirationBySlug(slug: string) {
  return useSanityQuery<Inspiration>(inspirationBySlugQuery(slug))
}
