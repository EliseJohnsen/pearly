'use client'

import {createContext, useContext, useState, useEffect, ReactNode} from 'react'

type Locale = 'nb' | 'en'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({children}: {children: ReactNode}) {
  const [locale, setLocaleState] = useState<Locale>('nb')

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null
    if (savedLocale && (savedLocale === 'nb' || savedLocale === 'en')) {
      setLocaleState(savedLocale)
    }
  }, [])

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  return (
    <LocaleContext.Provider value={{locale, setLocale}}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

// Language switcher component
export function LanguageSwitcher() {
  const {locale, setLocale} = useLocale()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLocale('nb')}
        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
          locale === 'nb'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        NO
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
          locale === 'en'
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
    </div>
  )
}
