import { staticLocale } from './config'
import { getDictionary } from './dictionaries'

export async function getServerTranslation(key: string): Promise<string> {
  const locale = staticLocale
  const dictionary = await getDictionary(locale)

  const keys = key.split('.')
  let value = dictionary

  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) return key
  }

  return typeof value === 'string' ? value : key
}
