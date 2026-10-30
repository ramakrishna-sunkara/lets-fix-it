import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  isSupabaseConfigured,
  supabase,
  type Profile,
} from '../lib/supabase'

type AuthContextValue = {
  isConfigured: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<string | null>
  updateProfile: (input: {
    display_name?: string
    phone?: string
  }) => Promise<string | null>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) {
    return null
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, phone, display_name')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.warn('Profile fetch failed:', error.message)
    return null
  }
  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null)
      return
    }
    const nextProfile: Profile | null = await fetchProfile(session.user.id)
    setProfile(nextProfile)
  }, [session?.user?.id])

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }
      setSession(data.session)
      setIsLoading(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
      },
    )
    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const signUp = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      if (!supabase) {
        return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      }
      const { error } = await supabase.auth.signUp({ email, password })
      return error?.message || null
    },
    [],
  )

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      if (!supabase) {
        return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return error?.message || null
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (!supabase) {
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const resetPassword = useCallback(
    async (email: string): Promise<string | null> => {
      if (!supabase) {
        return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      })
      return error?.message || null
    },
    [],
  )

  const updateProfile = useCallback(
    async (input: {
      display_name?: string
      phone?: string
    }): Promise<string | null> => {
      if (!supabase || !session?.user?.id) {
        return 'Sign in required to update profile.'
      }
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email,
        display_name: input.display_name,
        phone: input.phone,
        updated_at: new Date().toISOString(),
      })
      if (error) {
        return error.message
      }
      await refreshProfile()
      return null
    },
    [refreshProfile, session?.user?.email, session?.user?.id],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      isLoading,
      session,
      user: session?.user || null,
      profile,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
    }),
    [
      isLoading,
      session,
      profile,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
