'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getStaticLocale } from './config'
// Import dictionaries statically for better performance
import enDictionary from './dictionaries/en.json'
import itDictionary from './dictionaries/it.json'

// Create a dictionary map for instant access
const dictionaries: Record<string, Record<string, any>> = {
  en: enDictionary,
  it: itDictionary
}

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
  const locale = getStaticLocale()
  // Start with the dictionary already loaded instead of an empty object
  const [dictionary, setDictionary] = useState<Record<string, any>>(dictionaries[locale] || dictionaries.en)
  const [loading, setLoading] = useState(false)

  // This useEffect ensures the right dictionary is used if locale changes
  useEffect(() => {
    // If we already have the dictionary for this locale, use it immediately
    if (dictionaries[locale]) {
      setDictionary(dictionaries[locale])
      return
    }
    
    // Only fetch dynamically if it's not in our static dictionaries
    async function loadDictionary() {
      setLoading(true)
      try {
        const dict = await import(`./dictionaries/${locale}.json`).then(module => module.default)
        setDictionary(dict)
      } catch (error) {
        console.warn(`Dictionary for locale "${locale}" not found, using default locale "en" instead`)
        setDictionary(dictionaries.en)
      } finally {
        setLoading(false)
      }
    }
    
    loadDictionary()
  }, [locale])

  function t(key: string): string {
    // Don't return the key during loading, use the existing dictionary
    // which should already have values from static imports
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