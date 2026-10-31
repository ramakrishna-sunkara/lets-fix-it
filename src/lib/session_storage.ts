const GUEST_KEY = 'lfi_guest_session_v1'

/** Clears any leftover guest session from earlier POC builds. */
export function clearGuestSession(): void {
  try {
    localStorage.removeItem(GUEST_KEY)
  } catch {
    // ignore storage errors
  }
}
