'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getStaticLocale } from './config'
import { getDictionary } from './dictionaries'

interface I18nContextProps {
  t: (key: string) => string
  locale: string
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const locale = 'it'
  const [dictionary, setDictionary] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDictionary() {
      console.log('Loading dictionary for locale:', locale)
      const dict = await getDictionary(locale)
      console.log('Dictionary loaded:', dict)
      setDictionary(dict)
      setLoading(false)
    }
    
    loadDictionary()
  }, [locale])

  function t(key: string): string {
    if (loading) return key

    const keys = key.split('.')
    let value = dictionary
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return key
    }
    
    return typeof value === 'string' ? value : key
  }

  return (
    <I18nContext.Provider value={{ t, locale }}>
      {children}
    </I18nContext.Provider>
  )
} 