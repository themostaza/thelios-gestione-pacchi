import { defaultLocale } from './config'

// Implementazione del fallback al dizionario di default
export async function getDictionary(locale: string) {
  try {
    // Prima prova a caricare il dizionario per la lingua richiesta
    return (await import(`./dictionaries/${locale}.json`)).default
  } catch (error) {
    console.warn(`Dictionary for locale "${locale}" not found, using default locale "${defaultLocale}" instead`)
    
    // Se non esiste, fallback alla lingua predefinita
    return (await import(`./dictionaries/${defaultLocale}.json`)).default
  }
} 