// Shared certificates — the "Copy share link" option. When the backend is
// configured, a single certificate is saved to public.shared_certificates and
// rendered for anyone at /c/:slug. In demo mode there is nowhere to store it,
// so these helpers no-op and the UI falls back to file sharing only.
import { supabase } from "./supabase"
import type { CertFields, CertPage } from "@/components/Certificate"
import type { Recipient } from "./honor"

/** Unguessable, URL-safe slug (two UUIDs of entropy, hex only). */
function newSlug(): string {
  const rnd = () => crypto.randomUUID().replace(/-/g, "")
  return (rnd() + rnd()).slice(0, 24)
}

export function shareUrl(slug: string): string {
  return `${window.location.origin}/c/${slug}`
}

/** Save one certificate and return its public URL, or null when unavailable. */
export async function createShareLink(orgId: string | null, page: CertPage): Promise<string | null> {
  if (!supabase || !orgId) return null
  const { data: auth } = await supabase.auth.getUser()
  const f = page.fields
  const slug = newSlug()
  const { error } = await supabase.from("shared_certificates").insert({
    slug,
    organisation_id: orgId,
    created_by: auth.user?.id ?? null,
    template: f.template,
    accent: f.accent,
    logo: f.logo,
    org: f.org,
    award: f.award,
    recipient_name: page.recipient?.name ?? "Recipient",
    reason: page.recipient?.reason ?? null,
    signatory: f.signatory,
    cert_date: f.date,
  })
  if (error) return null
  return shareUrl(slug)
}

export interface SharedCertificate {
  fields: CertFields
  recipient: Recipient
  createdAt: string
}

/** Resolve a shared certificate by slug for the public viewer (works for anon). */
export async function fetchSharedCertificate(slug: string): Promise<SharedCertificate | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc("get_shared_certificate", { p_slug: slug })
  if (error) return null
  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        template: string
        accent: string
        logo: string | null
        org: string
        award: string
        recipient_name: string
        reason: string | null
        signatory: string | null
        cert_date: string | null
        created_at: string
      }
    | undefined
  if (!row) return null
  return {
    fields: {
      template: row.template,
      accent: row.accent,
      logo: row.logo,
      org: row.org,
      award: row.award,
      date: row.cert_date ?? "",
      signatory: row.signatory ?? "",
    },
    recipient: { name: row.recipient_name, reason: row.reason ?? "" },
    createdAt: row.created_at,
  }
}
