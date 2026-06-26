import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when Supabase env vars are present. When false the app runs in
 *  demo mode — no login, local-only state — so the public demo keeps working. */
export const isSupabaseConfigured = Boolean(url && anon)

export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url!, anon!) : null
