import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && supabaseAnonKey,
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type Profile = {
  id: string
  email: string | null
  phone: string | null
  display_name: string | null
}

export type RepairSessionRow = {
  id: string
  user_id: string
  title: string
  category: string | null
  status: string
  product_summary: Record<string, unknown>
  messages: unknown[]
  diagnosis: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
