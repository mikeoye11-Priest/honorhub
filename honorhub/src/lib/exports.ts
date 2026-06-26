// Certificate exports log — record each generate, read aggregate stats.
import { useCallback, useEffect, useState } from "react"
import { supabase } from "./supabase"
import { useAuth } from "./auth"

export interface ExportInput {
  count: number
  template: string
  award: string
  packKey: string | null
  format?: string
}

/** Fire-and-forget: log a generate action for the active org (no-op in demo mode). */
export async function recordExport(orgId: string | null, input: ExportInput): Promise<void> {
  if (!supabase || !orgId) return
  const { data: auth } = await supabase.auth.getUser()
  await supabase.from("certificate_exports").insert({
    organisation_id: orgId,
    created_by: auth.user?.id ?? null,
    count: input.count,
    template: input.template,
    award: input.award,
    pack_key: input.packKey,
    format: input.format ?? "pdf",
  })
}

export interface ExportStats {
  exports: number
  certificates: number
  last7: number
}

const EMPTY: ExportStats = { exports: 0, certificates: 0, last7: 0 }

/** Aggregate export stats for the active org (used to make dashboards real). */
export function useExportStats() {
  const { configured, activeOrgId } = useAuth()
  const live = configured && Boolean(activeOrgId)
  const [stats, setStats] = useState<ExportStats>(EMPTY)
  const [loading, setLoading] = useState(live)

  const load = useCallback(async () => {
    if (!supabase || !activeOrgId) return
    setLoading(true)
    const { data } = await supabase
      .from("certificate_exports")
      .select("count, created_at")
      .eq("organisation_id", activeOrgId)
      .order("created_at", { ascending: false })
      .limit(2000)
    const rows = (data ?? []) as { count: number; created_at: string }[]
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const next: ExportStats = { exports: rows.length, certificates: 0, last7: 0 }
    for (const r of rows) {
      next.certificates += r.count
      if (new Date(r.created_at).getTime() >= weekAgo) next.last7 += r.count
    }
    setStats(next)
    setLoading(false)
  }, [activeOrgId])

  useEffect(() => {
    if (!live) {
      setStats(EMPTY)
      setLoading(false)
      return
    }
    void load()
  }, [live, load])

  return { stats, loading, live, reload: load }
}
