export const defaultLocale = 'en'
export const locales = ['en', 'it']

// This is the static language configuration (can be changed here)
export const staticLocale = 'it'

// Function to get the static locale (can be used throughout the app)
export function getStaticLocale() {
  return staticLocale
}
