import type { ChatMessage, DiagnosisResponse } from './types'

const GUEST_KEY = 'lfi_guest_session_v1'

export type GuestSession = {
  title: string
  messages: ChatMessage[]
  diagnosis: DiagnosisResponse | null
  updatedAt: string
}

export function loadGuestSession(): GuestSession | null {
  try {
    const raw: string | null = localStorage.getItem(GUEST_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as GuestSession
  } catch {
    return null
  }
}

export function saveGuestSession(session: GuestSession): void {
  localStorage.setItem(GUEST_KEY, JSON.stringify(session))
}

export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_KEY)
}
