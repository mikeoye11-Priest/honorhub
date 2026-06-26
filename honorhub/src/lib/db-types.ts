// Hand-written types mirroring supabase/migrations/0001_tenancy.sql.
import type { VerticalKey } from "./honor"

export type Role = "admin" | "manager" | "contributor" | "viewer"

export interface Account {
  id: string
  name: string
  plan: string
  created_at: string
}

export interface Organisation {
  id: string
  account_id: string
  name: string
  vertical: VerticalKey
  logo_url: string | null
  accent: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
}

export interface Membership {
  id: string
  organisation_id: string
  user_id: string
  role: Role
  created_at: string
  // joined organisation (when selected with a relation)
  organisations?: Organisation
}
