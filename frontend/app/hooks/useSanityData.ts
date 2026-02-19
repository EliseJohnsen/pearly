'use client'

import {useEffect, useState} from 'react'
import {client} from '@/lib/sanity'
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
  footerPagesQuery,
  footerQuery,
  comingSoonQuery,
  allEmailTemplatesQuery,
} from '@/lib/queries'
import type {
  Navigation,
  Hero,
  Banner,
  HowItWorks,
  UIString,
  PageSettings,
  Footer,
  ComingSoon,
  EmailTemplate,
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

export function useAllEmailTemplate() {
  return useSanityQuery<EmailTemplate[]>(allEmailTemplatesQuery)
}

// UI Strings hooks
export function useUIStrings() {
  return useSanityQuery<UIString[]>(uiStringsQuery)
}

export function useUIStringsByCategory(category: string) {
  return useSanityQuery<UIString[]>(uiStringsByCategoryQuery(category))
}

export function useUIString(key: string): string {
  const {data, loading} = useSanityQuery<{value: string} | null>(
    uiStringByKeyQuery(key)
  )

  // Return the value or the key as fallback
  if (loading || !data) return key
  return data.value || key
}

// UI String with variable replacement
export function useUIStringWithVars(
  key: string,
  vars?: Record<string, string | number>
): string {
  const {data, loading} = useSanityQuery<{value: string} | null>(
    uiStringByKeyQuery(key)
  )

  if (loading || !data) return key

  let result = data.value || key

  // Replace variables in format {variableName}
  if (vars) {
    Object.entries(vars).forEach(([varKey, varValue]) => {
      result = result.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(varValue))
    })
  }

  return result
}

// Page Settings hook
export function usePageSettings(page: string = 'home') {
  return useSanityQuery<PageSettings>(pageSettingsQuery(page))
}

export function useFooterPages() {
  return useSanityQuery<{slub: string}>(footerPagesQuery)
}

export function useFooter() {
  return useSanityQuery<Footer>(footerQuery)
}

export function useComingSoon() {
  return useSanityQuery<ComingSoon>(comingSoonQuery)
}
