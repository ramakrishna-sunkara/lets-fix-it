const FUNNY_LOADING_KEY = 'lfi_funny_loading_enabled'

export const FUNNY_LOADING_VIDEO = '/loading/brahmi-loading.mp4'

export function loadFunnyLoadingEnabled(): boolean {
  try {
    const raw: string | null = localStorage.getItem(FUNNY_LOADING_KEY)
    if (raw === null) {
      return true
    }
    return raw === 'true'
  } catch {
    return true
  }
}

export function saveFunnyLoadingEnabled(isEnabled: boolean): void {
  try {
    localStorage.setItem(FUNNY_LOADING_KEY, String(isEnabled))
  } catch {
    // ignore storage errors
  }
}
