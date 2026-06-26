// Org-scoped data access. All calls are RLS-protected: a user only ever
// reads/writes rows for organisations they belong to.
import { supabase } from "./supabase"
import type { Organisation, Signatory } from "./db-types"

export async function fetchOrganisation(id: string): Promise<Organisation | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from("organisations").select("*").eq("id", id).single()
  if (error) return null
  return data as Organisation
}

export type OrgPatch = Partial<
  Pick<
    Organisation,
    "name" | "vertical" | "accent" | "logo_url" | "template" | "default_award" | "default_reason" | "default_signatory" | "footer_text"
  >
>

export async function updateOrganisation(id: string, patch: OrgPatch): Promise<void> {
  if (!supabase) return
  await supabase.from("organisations").update(patch).eq("id", id)
}

export async function listSignatories(orgId: string): Promise<Signatory[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("signatories")
    .select("*")
    .eq("organisation_id", orgId)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true })
  return (data ?? []) as Signatory[]
}

export async function addSignatory(orgId: string, name: string, role: string): Promise<Signatory | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("signatories")
    .insert({ organisation_id: orgId, name, role })
    .select()
    .single()
  if (error) return null
  return data as Signatory
}

export async function setSignatoryActive(id: string, active: boolean): Promise<void> {
  if (!supabase) return
  await supabase.from("signatories").update({ active }).eq("id", id)
}

export async function deleteSignatory(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from("signatories").delete().eq("id", id)
}
