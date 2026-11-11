import { useCallback, useEffect, useMemo, useState } from 'react'
import { THEME_KEY, THEME_OPTIONS, ThemeContext } from './theme-context'

const readPreference = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return THEME_OPTIONS.includes(saved) ? saved : 'light'
  } catch {
    return 'light'
  }
}

const systemPrefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

/**
 * Light / Dark / System theme. The preference is stored per browser; "system"
 * follows the OS setting live. The chosen theme is written to
 * <html data-theme="light|dark">, which index.css uses to switch colors.
 * (index.html applies the same logic before React loads, to avoid a flash.)
 */
export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // Follow OS changes while "system" is selected.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Keep tabs in sync when the preference changes elsewhere.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_KEY) setPreferenceState(readPreference())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  const setPreference = useCallback((value) => {
    if (!THEME_OPTIONS.includes(value)) return
    setPreferenceState(value)
    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      /* storage unavailable: still applies for this visit */
    }
  }, [])

  const value = useMemo(() => ({ preference, theme: resolved, setPreference }), [preference, resolved, setPreference])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
