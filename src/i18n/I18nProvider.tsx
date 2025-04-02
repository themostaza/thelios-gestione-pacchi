'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

import { getStaticLocale } from './config'
// Import dictionaries statically for better performance
import enDictionary from './dictionaries/en.json'
import itDictionary from './dictionaries/it.json'

// Create a type for the translation dictionaries
type TranslationDictionary = {
  [key: string]: string | TranslationDictionary
}

// Create a dictionary map for instant access
const dictionaries: Record<string, TranslationDictionary> = {
  en: enDictionary,
  it: itDictionary,
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
  const [dictionary, setDictionary] = useState<TranslationDictionary>(dictionaries[locale] || dictionaries.en)

  // This useEffect ensures the right dictionary is used if locale changes
  useEffect(() => {
    // If we already have the dictionary for this locale, use it immediately
    if (dictionaries[locale]) {
      setDictionary(dictionaries[locale])
      return
    }

    // Only fetch dynamically if it's not in our static dictionaries
    async function loadDictionary() {
      try {
        const dict = await import(`./dictionaries/${locale}.json`).then((module) => module.default)
        setDictionary(dict)
      } catch {
        console.warn(`Dictionary for locale "${locale}" not found, using default locale "en" instead`)
        setDictionary(dictionaries.en)
      } finally {
      }
    }

    loadDictionary()
  }, [locale])

  const t = useCallback(
    (key: string): string => {
      // Helper function to get nested values without using 'any'
      function getValueByPath(obj: TranslationDictionary, path: string): string | null {
        return path.split('.').reduce<string | TranslationDictionary | null>((prev, curr) => {
          if (!prev || typeof prev !== 'object') return null
          return prev[curr] || null
        }, obj) as string | null
      }

      const translation = getValueByPath(dictionary, key)
      if (!translation || typeof translation !== 'string') {
        // Fallback to English if translation is missing
        const enTranslation = getValueByPath(dictionaries.en, key)
        return typeof enTranslation === 'string' ? enTranslation : key
      }
      return translation
    },
    [dictionary]
  )

  return <I18nContext.Provider value={{ t, locale }}>{children}</I18nContext.Provider>
}
