// Certificate exports log — record each generate, read aggregate stats.
import { useCallback, useEffect, useState } from "react"
import { supabase } from "./supabase"
import { useAuth } from "./auth"
import { TEMPLATES } from "./honor"

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
  exports: number // number of generate actions
  certificates: number // all-time certificates (sum of count)
  last7: number // certificates in the last 7 days
  last30: number // certificates in the last 30 days
  activeDays: number // distinct days with activity in the last 30
  awardCount: number // distinct award types ever used
}

const EMPTY: ExportStats = { exports: 0, certificates: 0, last7: 0, last30: 0, activeDays: 0, awardCount: 0 }

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
      .select("count, award, created_at")
      .eq("organisation_id", activeOrgId)
      .order("created_at", { ascending: false })
      .limit(5000)
    const rows = (data ?? []) as { count: number; award: string | null; created_at: string }[]
    const now = Date.now()
    const weekAgo = now - 7 * DAY
    const monthAgo = now - 30 * DAY
    const awards = new Set<string>()
    const activeDays = new Set<string>()
    const next: ExportStats = { exports: rows.length, certificates: 0, last7: 0, last30: 0, activeDays: 0, awardCount: 0 }
    for (const r of rows) {
      next.certificates += r.count
      const t = new Date(r.created_at).getTime()
      if (t >= weekAgo) next.last7 += r.count
      if (t >= monthAgo) {
        next.last30 += r.count
        activeDays.add(new Date(r.created_at).toDateString())
      }
      if (r.award) awards.add(r.award.trim())
    }
    next.activeDays = activeDays.size
    next.awardCount = awards.size
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

// ---------------------------------------------------------------------------
// Rich analytics for the Reports page — all computed from the same
// certificate_exports rows. NB: recipient names are never stored, so every
// metric here is about volume, timing, templates and awards (never people).
// ---------------------------------------------------------------------------

interface ExportRow {
  count: number
  template: string | null
  award: string | null
  created_at: string
}

export interface NamedCount {
  name: string
  count: number
  pct: number // share of the top entry, for bar widths (0-100)
}

export interface TemplateRow {
  template: string
  name: string
  count: number
  share: number // share of total certificates (0-100)
  topAward: string
  lastUsed: string // localised date
  recent: boolean // activity in the last 7 days
}

export interface Insight {
  tag: string
  body: string
  tone: "good" | "info" | "warn"
}

export interface ExportAnalytics {
  hasData: boolean
  totalCerts: number
  totalExports: number
  last7: number
  prev7: number
  last30: number
  weekDeltaPct: number | null // last7 vs prev7, null when no prior baseline
  activeDays: number // distinct days with activity in the last 30
  avgPerExport: number
  daily30: { label: string; count: number }[] // 30 buckets, oldest → newest
  topAwards: NamedCount[]
  byTemplate: TemplateRow[]
  insights: Insight[]
}

const EMPTY_ANALYTICS: ExportAnalytics = {
  hasData: false,
  totalCerts: 0,
  totalExports: 0,
  last7: 0,
  prev7: 0,
  last30: 0,
  weekDeltaPct: null,
  activeDays: 0,
  avgPerExport: 0,
  daily30: [],
  topAwards: [],
  byTemplate: [],
  insights: [],
}

const DAY = 24 * 60 * 60 * 1000
const TEMPLATE_NAME = new Map(TEMPLATES.map((t) => [t.key, t.name]))
const dayKey = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })

function buildAnalytics(rows: ExportRow[]): ExportAnalytics {
  if (rows.length === 0) return EMPTY_ANALYTICS

  const now = Date.now()
  const week = 7 * DAY

  let totalCerts = 0
  let last7 = 0
  let prev7 = 0
  let last30 = 0
  const awardTotals = new Map<string, number>()
  const activeDaySet = new Set<string>()
  // Per-template aggregates
  const tpl = new Map<string, { count: number; awards: Map<string, number>; lastUsed: number; recent: boolean }>()
  // 30 daily buckets, indexed by days-ago (0 = today)
  const buckets = new Array<number>(30).fill(0)

  for (const r of rows) {
    const n = r.count || 0
    const t = new Date(r.created_at).getTime()
    const ageMs = now - t
    totalCerts += n
    if (ageMs <= week) last7 += n
    else if (ageMs <= 2 * week) prev7 += n
    if (ageMs <= 30 * DAY) {
      last30 += n
      activeDaySet.add(new Date(r.created_at).toDateString())
      const idx = Math.floor(ageMs / DAY)
      if (idx >= 0 && idx < 30) buckets[idx] += n
    }

    const award = (r.award || "Recognition").trim()
    awardTotals.set(award, (awardTotals.get(award) ?? 0) + n)

    const key = r.template || "custom"
    const agg = tpl.get(key) ?? { count: 0, awards: new Map(), lastUsed: 0, recent: false }
    agg.count += n
    agg.awards.set(award, (agg.awards.get(award) ?? 0) + n)
    if (t > agg.lastUsed) agg.lastUsed = t
    if (ageMs <= week) agg.recent = true
    tpl.set(key, agg)
  }

  // Award leaderboard (top 5), pct relative to the leader
  const sortedAwards = [...awardTotals.entries()].sort((a, b) => b[1] - a[1])
  const awardMax = sortedAwards[0]?.[1] ?? 1
  const topAwards: NamedCount[] = sortedAwards.slice(0, 5).map(([name, count]) => ({
    name,
    count,
    pct: Math.round((count / awardMax) * 100),
  }))

  // Per-template breakdown, share of total certificates
  const byTemplate: TemplateRow[] = [...tpl.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([template, agg]) => {
      const topAward = [...agg.awards.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
      return {
        template,
        name: TEMPLATE_NAME.get(template) ?? (template === "custom" ? "Custom design" : template),
        count: agg.count,
        share: Math.round((agg.count / totalCerts) * 100),
        topAward,
        lastUsed: new Date(agg.lastUsed).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        recent: agg.recent,
      }
    })

  // 30-day trend, oldest → newest for left-to-right reading
  const daily30 = buckets
    .map((count, i) => ({ label: dayKey(new Date(now - i * DAY)), count }))
    .reverse()

  const weekDeltaPct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 > 0 ? 100 : null

  // Data-driven insights
  const insights: Insight[] = []
  if (topAwards[0]) {
    insights.push({
      tag: "Top recognition",
      body: `“${topAwards[0].name}” leads with ${topAwards[0].count.toLocaleString()} ${topAwards[0].count === 1 ? "certificate" : "certificates"}.`,
      tone: "good",
    })
  }
  if (weekDeltaPct !== null && prev7 > 0) {
    const up = weekDeltaPct >= 0
    insights.push({
      tag: up ? "Momentum" : "Heads up",
      body: `Recognition is ${up ? "up" : "down"} ${Math.abs(weekDeltaPct)}% this week versus last week.`,
      tone: up ? "info" : "warn",
    })
  }
  if (byTemplate[0]) {
    insights.push({
      tag: "Favourite template",
      body: `“${byTemplate[0].name}” accounts for ${byTemplate[0].share}% of your certificates.`,
      tone: "info",
    })
  }

  return {
    hasData: true,
    totalCerts,
    totalExports: rows.length,
    last7,
    prev7,
    last30,
    weekDeltaPct,
    activeDays: activeDaySet.size,
    avgPerExport: rows.length ? Math.round((totalCerts / rows.length) * 10) / 10 : 0,
    daily30,
    topAwards,
    byTemplate,
    insights,
  }
}

/** Full analytics for the active org's Reports page. */
export function useExportAnalytics() {
  const { configured, activeOrgId } = useAuth()
  const live = configured && Boolean(activeOrgId)
  const [analytics, setAnalytics] = useState<ExportAnalytics>(EMPTY_ANALYTICS)
  const [loading, setLoading] = useState(live)

  const load = useCallback(async () => {
    if (!supabase || !activeOrgId) return
    setLoading(true)
    const { data } = await supabase
      .from("certificate_exports")
      .select("count, template, award, created_at")
      .eq("organisation_id", activeOrgId)
      .order("created_at", { ascending: false })
      .limit(5000)
    setAnalytics(buildAnalytics((data ?? []) as ExportRow[]))
    setLoading(false)
  }, [activeOrgId])

  useEffect(() => {
    if (!live) {
      setAnalytics(EMPTY_ANALYTICS)
      setLoading(false)
      return
    }
    void load()
  }, [live, load])

  return { analytics, loading, live, reload: load }
}
