// Organisation invites — admin creates a shareable invite link; invitee joins
// the org on signup via the accept_invite() RPC.
import { supabase } from "./supabase"
import type { Invite, Role } from "./db-types"

function newToken(): string {
  // Two UUIDs of entropy, hex-only — safe in a URL.
  const rnd = () => crypto.randomUUID().replace(/-/g, "")
  return rnd() + rnd().slice(0, 8)
}

export function inviteLink(token: string): string {
  return `${window.location.origin}/login?invite=${token}`
}

export async function listInvites(orgId: string): Promise<Invite[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("organisation_invites")
    .select("*")
    .eq("organisation_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
  return (data ?? []) as Invite[]
}

export async function createInvite(orgId: string, email: string, role: Role): Promise<Invite | null> {
  if (!supabase) return null
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("organisation_invites")
    .insert({ organisation_id: orgId, email, role, token: newToken(), created_by: auth.user?.id ?? null })
    .select()
    .single()
  if (error) return null
  return data as Invite
}

export async function revokeInvite(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from("organisation_invites").update({ status: "revoked" }).eq("id", id)
}

/** Current user joins the invite's org. Returns the org id, or null if invalid. */
export async function acceptInvite(token: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token })
  if (error) return null
  return (data as string) ?? null
}
