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
  template: string
  default_award: string | null
  default_reason: string | null
  default_signatory: string | null
  footer_text: string | null
  created_at: string
}

export interface Signatory {
  id: string
  organisation_id: string
  name: string
  role: string | null
  active: boolean
  sort: number
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
}

export interface Invite {
  id: string
  organisation_id: string
  email: string
  role: Role
  token: string
  status: "pending" | "accepted" | "revoked"
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
