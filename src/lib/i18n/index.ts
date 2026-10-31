import { en } from './en'
import { te } from './te'
import type { Locale, TranslationDict } from './types'

export type { Locale, TranslationDict }

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_STORAGE_KEY = 'lets-fix-it.locale'

export const SUPPORTED_LOCALES: ReadonlyArray<{
  id: Locale
  nativeLabel: string
  speechLang: string
}> = [
  { id: 'en', nativeLabel: 'English', speechLang: 'en-US' },
  { id: 'te', nativeLabel: 'తెలుగు', speechLang: 'te-IN' },
]

const dictionaries: Record<Locale, TranslationDict> = {
  en,
  te,
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'te'
}

export function getDictionary(locale: Locale): TranslationDict {
  return dictionaries[locale] || dictionaries.en
}

export function readStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }
  try {
    const stored: string | null = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) {
      return stored
    }
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
  return DEFAULT_LOCALE
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore storage errors
  }
}

export function speechLangForLocale(locale: Locale): string {
  return (
    SUPPORTED_LOCALES.find((item) => item.id === locale)?.speechLang || 'en-US'
  )
}
