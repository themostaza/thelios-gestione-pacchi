import { getStaticLocale } from './config'
import enTranslations from './dictionaries/en.json'
import itTranslations from './dictionaries/it.json'

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object ? `${Key}.${NestedKeyOf<ObjectType[Key]>}` : `${Key}`
}[keyof ObjectType & (string | number)]

type TranslationKey = NestedKeyOf<typeof enTranslations>

const dictionaries = {
  en: enTranslations,
  it: itTranslations,
}

type TranslationDictionary = {
  [key: string]: string | TranslationDictionary
}

function getValueByPath(obj: TranslationDictionary, path: string): string | null {
  return path.split('.').reduce<TranslationDictionary | string | null>((prev, curr) => {
    if (!prev || typeof prev === 'string') return null
    return prev[curr]
  }, obj) as string | null
}

export function t(key: TranslationKey, locale = getStaticLocale()): string {
  // Fallback to english if the locale doesn't exist
  const dictionary = dictionaries[locale as keyof typeof dictionaries] || dictionaries.en

  const translation = getValueByPath(dictionary, key)

  // Fallback to english if the translation doesn't exist
  if (!translation) {
    return getValueByPath(dictionaries.en, key) || key
  }

  return translation
}
