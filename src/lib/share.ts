// Shared certificates — the "Copy share link" option. When the backend is
// configured, a certificate's NON-PII design is saved to public.shared_certificates
// and rendered for anyone at /c/:slug. The recipient (pupil) name + message are
// NEVER stored server-side — they travel only in the URL fragment (#…), which the
// browser does not send to the server. In demo mode these helpers no-op.
import { supabase } from "./supabase"
import type { CertFields, CertPage } from "@/components/Certificate"
import type { Recipient } from "./honor"

/** Unguessable, URL-safe slug (two UUIDs of entropy, hex only). */
function newSlug(): string {
  const rnd = () => crypto.randomUUID().replace(/-/g, "")
  return (rnd() + rnd()).slice(0, 24)
}

/** Public URL for a slug. The recipient (if given) is encoded in the fragment,
 *  so their name/message stay client-side and never reach the server. */
export function shareUrl(slug: string, recipient?: Recipient): string {
  const base = `${window.location.origin}/c/${slug}`
  if (!recipient) return base
  const frag = new URLSearchParams({ n: recipient.name, r: recipient.reason || "" }).toString()
  return `${base}#${frag}`
}

/** Recover the recipient from a share URL fragment (client-side only). */
export function recipientFromHash(hash: string): Recipient {
  const p = new URLSearchParams(hash.replace(/^#/, ""))
  return { name: p.get("n") || "Recipient", reason: p.get("r") || "" }
}

/** Save a certificate's design (no pupil PII) and return its public URL. */
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
    signatory: f.signatory,
    cert_date: f.date,
  })
  if (error) return null
  return shareUrl(slug, page.recipient)
}

export interface SharedDesign {
  fields: CertFields
  createdAt: string
}

/** Resolve a shared certificate's design by slug (works for anon visitors). */
export async function fetchSharedDesign(slug: string): Promise<SharedDesign | null> {
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
    createdAt: row.created_at,
  }
}
