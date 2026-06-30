// Organisation members — read the real membership list, change roles, remove.
import { supabase } from "./supabase"
import type { Role } from "./db-types"

export interface Member {
  id: string // membership id
  user_id: string
  role: Role
  created_at: string
  full_name: string | null
  email: string | null
}

interface MemberRow {
  id: string
  user_id: string
  role: Role
  created_at: string
  profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null
}

export async function listMembers(orgId: string): Promise<Member[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("organisation_memberships")
    .select("id, user_id, role, created_at, profiles(full_name, email)")
    .eq("organisation_id", orgId)
    .order("created_at", { ascending: true })
  return ((data ?? []) as MemberRow[]).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    return { id: r.id, user_id: r.user_id, role: r.role, created_at: r.created_at, full_name: p?.full_name ?? null, email: p?.email ?? null }
  })
}

export async function updateMemberRole(membershipId: string, role: Role): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from("organisation_memberships").update({ role }).eq("id", membershipId)
  return !error
}

export async function removeMember(membershipId: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from("organisation_memberships").delete().eq("id", membershipId)
  return !error
}
