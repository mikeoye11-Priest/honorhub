import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, TrendingUp, TrendingDown, PartyPopper, Users, Award, Sparkles, Download, Minus, Loader2 } from "lucide-react"
import { useExportAnalytics, type ExportAnalytics } from "@/lib/exports"

// ---- Illustrative figures for the public demo (no backend / no data) --------
const DEMO_IMPACT = [45, 60, 55, 80, 70, 95, 85, 65, 75, 90, 40, 55]

const DEMO_METRICS = [
  { label: "Total Recognitions", value: "1,240", delta: "12% vs last month", up: true, icon: PartyPopper, tint: "bg-info/10 text-info" },
  { label: "Unique Recipients", value: "856", delta: "8% vs last month", up: true, icon: Users, tint: "bg-accent text-primary" },
  { label: "Certificates Generated", value: "1,102", delta: "Stable", up: false, icon: Award, tint: "bg-warning/10 text-warning" },
]

const DEMO_CATEGORIES = [
  { name: "Leadership Excellence", count: 412, pct: 85 },
  { name: "Innovation Star", count: 328, pct: 65 },
  { name: "Culture Champion", count: 291, pct: 58 },
]

const DEMO_DISTRIBUTION = [
  { name: "Year 4", count: 342, rate: 92, sub: "Sarah J.", status: "Excellent", recent: true },
  { name: "Year 3", count: 215, rate: 78, sub: "Amy L.", status: "Stable", recent: false },
  { name: "Reception", count: 188, rate: 84, sub: "Mike R.", status: "Growing", recent: true },
]

const DEMO_INSIGHTS = [
  { tag: "Growth opportunity", body: "Recognition is up 12% in Year 4 this month.", tone: "good" as const },
  { tag: "Peer spotlight", body: "Sarah Jenkins received 5 Kindness awards in 7 days — consider a featured highlight.", tone: "info" as const },
  { tag: "Alert", body: "Reception participation dipped 4% — an engagement prompt is recommended.", tone: "warn" as const },
]

const INSIGHT_TONE: Record<"good" | "info" | "warn", string> = {
  good: "text-primary",
  info: "text-info",
  warn: "text-warning",
}

// View-model shared by the demo and live branches ----------------------------
interface ReportView {
  metrics: { label: string; value: string; delta: string; up: boolean; icon: typeof Award; tint: string }[]
  impact: number[] // bar heights as 0-100 percentages
  categories: { name: string; count: number; pct: number }[]
  distribution: { name: string; count: number; rate: number; sub: string; status: string; recent: boolean }[]
  insights: { tag: string; body: string; tone: "good" | "info" | "warn" }[]
  health: { label: string; big: string; deltaPct: number | null; barPct: number; caption: string }
  distHeaders: [string, string, string, string, string]
}

function demoView(): ReportView {
  return {
    metrics: DEMO_METRICS,
    impact: DEMO_IMPACT,
    categories: DEMO_CATEGORIES,
    distribution: DEMO_DISTRIBUTION,
    insights: DEMO_INSIGHTS,
    health: { label: "Recognition Health Score", big: "88%", deltaPct: 5, barPct: 88, caption: "Based on participation rate and sentiment." },
    distHeaders: ["Group", "Recognitions", "Engagement", "Top contributor", "Status"],
  }
}

function liveView(a: ExportAnalytics): ReportView {
  const max = Math.max(1, ...a.daily30.map((d) => d.count))
  return {
    metrics: [
      {
        label: "Total Recognitions",
        value: a.totalCerts.toLocaleString(),
        delta: `${a.last7.toLocaleString()} in the last 7 days`,
        up: a.last7 > 0,
        icon: PartyPopper,
        tint: "bg-info/10 text-info",
      },
      {
        label: "Export actions",
        value: a.totalExports.toLocaleString(),
        delta: `${a.avgPerExport} certificates per action`,
        up: false,
        icon: Award,
        tint: "bg-warning/10 text-warning",
      },
      {
        label: "Active days (30d)",
        value: a.activeDays.toLocaleString(),
        delta: `${a.last30.toLocaleString()} certificates this month`,
        up: a.last30 > 0,
        icon: CalendarDays,
        tint: "bg-accent text-primary",
      },
    ],
    impact: a.daily30.map((d) => (d.count === 0 ? 0 : Math.max(6, Math.round((d.count / max) * 100)))),
    categories: a.topAwards.map((t) => ({ name: t.name, count: t.count, pct: t.pct })),
    distribution: a.byTemplate.map((t) => ({
      name: t.name,
      count: t.count,
      rate: t.share,
      sub: t.topAward,
      status: t.recent ? "Active" : "Quiet",
      recent: t.recent,
    })),
    insights: a.insights,
    health: {
      label: "Recognitions this week",
      big: a.last7.toLocaleString(),
      deltaPct: a.weekDeltaPct,
      barPct: a.last30 > 0 ? Math.round((a.last7 / a.last30) * 100) : 0,
      caption: `${a.last7.toLocaleString()} of ${a.last30.toLocaleString()} certificates in the last 30 days.`,
    },
    distHeaders: ["Template", "Certificates", "Share", "Top award", "Status"],
  }
}

function downloadCsv(view: ReportView) {
  const header = [view.distHeaders[0], view.distHeaders[1], view.distHeaders[2], view.distHeaders[3], view.distHeaders[4]]
  const rows = view.distribution.map((d) => [d.name, d.count, `${d.rate}%`, d.sub, d.status])
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = "honorhub-recognition-log.csv"
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Recognition log exported", { description: "honorhub-recognition-log.csv" })
}

function EmptyReports() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed py-20 text-center">
      <PartyPopper className="size-8 text-muted-foreground/50" />
      <h3 className="mt-3 font-semibold">No recognitions yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Generate your first certificate and your real recognition trends, top awards and template usage will appear here.
      </p>
    </div>
  )
}

export default function Reports() {
  const card = "rounded-xl border bg-card shadow-soft"
  const { analytics, live, loading } = useExportAnalytics()

  const usingLive = live && analytics.hasData
  const view = usingLive ? liveView(analytics) : demoView()
  const impactMax = Math.max(1, ...view.impact)

  const onExport = (label: string) => {
    if (label.includes("CSV")) downloadCsv(view)
    else toast(`${label}`, { description: "This export format is coming soon." })
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recognition Reports</h1>
          <p className="mt-1 text-muted-foreground">
            The impact and frequency of recognition across your organisation.
            {usingLive ? null : <span className="ml-1 italic">Showing sample data — sign in to see your organisation’s figures.</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="font-medium">Last 30 days</span>
        </div>
      </div>

      <Tabs defaultValue="recognition">
        <TabsList>
          <TabsTrigger value="recognition">Recognition</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="recognition" className="mt-6">
          {loading ? (
            <div className="grid place-items-center rounded-xl border border-dashed py-20">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : live && !analytics.hasData ? (
            <EmptyReports />
          ) : (
            <div className="grid grid-cols-12 gap-4">
              {/* Health / this-week */}
              <div className={`${card} relative col-span-12 overflow-hidden p-5 lg:col-span-4`}>
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{view.health.label}</h3>
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{view.health.big}</span>
                  {view.health.deltaPct !== null && (
                    <span className={`flex items-center text-sm font-medium ${view.health.deltaPct >= 0 ? "text-success" : "text-warning"}`}>
                      {view.health.deltaPct >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                      {view.health.deltaPct >= 0 ? "+" : ""}
                      {view.health.deltaPct}%
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{view.health.caption}</p>
                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${view.health.barPct}%` }} />
                </div>
              </div>

              {/* Metric cards */}
              <div className="col-span-12 grid gap-4 sm:grid-cols-3 lg:col-span-8">
                {view.metrics.map((m) => (
                  <div key={m.label} className={`${card} p-5 transition-transform hover:-translate-y-0.5`}>
                    <span className={`grid size-10 place-items-center rounded-lg ${m.tint}`}>
                      <m.icon className="size-5" />
                    </span>
                    <p className="mt-3 text-sm text-muted-foreground">{m.label}</p>
                    <p className="text-2xl font-bold">{m.value}</p>
                    <p className={`mt-1 flex items-center gap-1 text-xs ${m.up ? "text-success" : "text-muted-foreground"}`}>
                      {m.up ? <TrendingUp className="size-3.5" /> : <Minus className="size-3.5" />} {m.delta}
                    </p>
                  </div>
                ))}
              </div>

              {/* Impact chart */}
              <div className={`${card} col-span-12 flex flex-col p-5 lg:col-span-8`}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Recognition impact</h3>
                    <p className="text-xs text-muted-foreground">Certificates generated over the last 30 days</p>
                  </div>
                </div>
                <div className="flex h-56 items-end gap-1">
                  {view.impact.map((b, i) => (
                    <div
                      key={i}
                      title={usingLive ? `${analytics.daily30[i]?.label}: ${analytics.daily30[i]?.count ?? 0}` : undefined}
                      className="group flex-1 rounded-t bg-primary/20 transition-colors hover:bg-primary"
                      style={{ height: `${(b / impactMax) * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* AI insights + categories */}
              <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
                <div className="relative overflow-hidden rounded-xl bg-foreground p-5 text-background shadow-md">
                  <Sparkles className="absolute right-4 top-4 size-5 animate-pulse text-primary" />
                  <h3 className="mb-3 font-semibold">{usingLive ? "Insights" : "AI Insights"}</h3>
                  <div className="flex flex-col gap-3">
                    {view.insights.length === 0 ? (
                      <p className="text-sm text-background/70">Insights appear as recognition activity builds up.</p>
                    ) : (
                      view.insights.map((ins) => (
                        <div key={ins.tag} className="rounded-lg border border-white/10 bg-white/10 p-3">
                          <p className={`mb-1 text-xs font-medium ${INSIGHT_TONE[ins.tone]}`}>{ins.tag}</p>
                          <p className="text-sm text-background/80">{ins.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className={`${card} flex-1 p-5`}>
                  <h3 className="mb-4 text-sm font-bold">Top award categories</h3>
                  <div className="flex flex-col gap-3">
                    {view.categories.map((c) => (
                      <div key={c.name}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-semibold">{c.name}</span>
                          <span>{c.count.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Distribution table */}
              <div className={`${card} col-span-12 overflow-hidden p-0`}>
                <div className="flex items-center justify-between border-b p-4">
                  <h3 className="font-semibold">{usingLive ? "Template breakdown" : "Recognition distribution"}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        {view.distHeaders.map((h) => (
                          <th key={h} className="px-6 py-3 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {view.distribution.map((d) => (
                        <tr key={d.name} className="hover:bg-muted/30">
                          <td className="px-6 py-3 font-semibold">{d.name}</td>
                          <td className="px-6 py-3">{d.count.toLocaleString()}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span>{d.rate}%</span>
                              <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                                <div className="h-full bg-success" style={{ width: `${d.rate}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">{d.sub}</td>
                          <td className="px-6 py-3">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${d.recent ? "bg-success/10 text-success" : "bg-accent text-primary"}`}>
                              {d.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          {usingLive ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total certificates", value: analytics.totalCerts.toLocaleString() },
                { label: "Export actions", value: analytics.totalExports.toLocaleString() },
                { label: "Avg certificates / action", value: String(analytics.avgPerExport) },
              ].map((s) => (
                <div key={s.label} className={`${card} p-5`}>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">Usage analytics — seats, generation volume and active users — appear here as your team grows.</CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Deeper analytics by user, template, group and time — coming soon.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="exports" className="mt-6">
          <Card>
            <CardContent className="flex flex-wrap gap-3 p-6">
              {["Recognition log (CSV)", "Monthly summary (PDF)", "Audit export"].map((x) => (
                <Button key={x} variant="outline" onClick={() => onExport(x)}>
                  <Download className="size-4" /> {x}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
