import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, TrendingUp, PartyPopper, Users, Award, Sparkles, Download, Minus } from "lucide-react"
import { useExportStats } from "@/lib/exports"

const IMPACT = [45, 60, 55, 80, 70, 95, 85, 65, 75, 90, 40, 55]

const METRICS = [
  { label: "Total Recognitions", value: "1,240", delta: "12% vs last month", up: true, icon: PartyPopper, tint: "bg-info/10 text-info" },
  { label: "Unique Recipients", value: "856", delta: "8% vs last month", up: true, icon: Users, tint: "bg-accent text-primary" },
  { label: "Certificates Generated", value: "1,102", delta: "Stable", up: false, icon: Award, tint: "bg-warning/10 text-warning" },
]

const CATEGORIES = [
  { name: "Leadership Excellence", count: 412, pct: 85 },
  { name: "Innovation Star", count: 328, pct: 65 },
  { name: "Culture Champion", count: 291, pct: 58 },
]

const DISTRIBUTION = [
  { dept: "Year 4", recognitions: 342, rate: 92, top: "Sarah J.", status: "Excellent", tone: "success" },
  { dept: "Year 3", recognitions: 215, rate: 78, top: "Amy L.", status: "Stable", tone: "primary" },
  { dept: "Reception", recognitions: 188, rate: 84, top: "Mike R.", status: "Growing", tone: "success" },
]

const INSIGHTS = [
  { tag: "Growth opportunity", body: "Recognition is up 12% in Year 4 this month.", tone: "text-primary" },
  { tag: "Peer spotlight", body: "Sarah Jenkins received 5 Kindness awards in 7 days — consider a featured highlight.", tone: "text-info" },
  { tag: "Alert", body: "Reception participation dipped 4% — an engagement prompt is recommended.", tone: "text-warning" },
]

function downloadCsv() {
  const header = ["Group", "Recognitions", "Engagement %", "Top contributor", "Status"]
  const rows = DISTRIBUTION.map((d) => [d.dept, d.recognitions, d.rate, d.top, d.status])
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = "honorhub-recognition-log.csv"
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Recognition log exported", { description: "honorhub-recognition-log.csv" })
}

export default function Reports() {
  const card = "rounded-xl border bg-card shadow-soft"
  const { stats, live } = useExportStats()

  const metricValue = (m: (typeof METRICS)[number]) =>
    live && m.label === "Certificates Generated" ? stats.certificates.toLocaleString() : m.value

  const onExport = (label: string) => {
    if (label.includes("CSV")) downloadCsv()
    else toast(`${label}`, { description: "This export format is coming soon." })
  }
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recognition Reports</h1>
          <p className="mt-1 text-muted-foreground">The impact and frequency of recognition across your organisation.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          <select className="cursor-pointer border-none bg-transparent font-medium outline-none">
            <option>Last 30 days</option>
            <option>Last quarter</option>
            <option>Year to date</option>
          </select>
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
          <div className="grid grid-cols-12 gap-4">
            {/* Health score */}
            <div className={`${card} relative col-span-12 overflow-hidden p-5 lg:col-span-4`}>
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recognition Health Score</h3>
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">88%</span>
                <span className="flex items-center text-sm font-medium text-success">
                  <TrendingUp className="size-4" /> +5%
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Based on participation rate and sentiment.</p>
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: "88%" }} />
              </div>
            </div>

            {/* Metric cards */}
            <div className="col-span-12 grid gap-4 sm:grid-cols-3 lg:col-span-8">
              {METRICS.map((m) => (
                <div key={m.label} className={`${card} p-5 transition-transform hover:-translate-y-0.5`}>
                  <span className={`grid size-10 place-items-center rounded-lg ${m.tint}`}>
                    <m.icon className="size-5" />
                  </span>
                  <p className="mt-3 text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold">{metricValue(m)}</p>
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
                  <p className="text-xs text-muted-foreground">Engagement trends over the last 30 days</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1"><span className="size-2 rounded-full bg-primary" /> Peer</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1"><span className="size-2 rounded-full bg-secondary" /> Manager</span>
                </div>
              </div>
              <div className="flex h-56 items-end gap-2">
                {IMPACT.map((b, i) => (
                  <div key={i} className="group flex-1 rounded-t-lg bg-primary/20 transition-colors hover:bg-primary" style={{ height: `${b}%` }} />
                ))}
              </div>
            </div>

            {/* AI insights + categories */}
            <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
              <div className="relative overflow-hidden rounded-xl bg-foreground p-5 text-background shadow-md">
                <Sparkles className="absolute right-4 top-4 size-5 animate-pulse text-primary" />
                <h3 className="mb-3 font-semibold">AI Insights</h3>
                <div className="flex flex-col gap-3">
                  {INSIGHTS.map((ins) => (
                    <div key={ins.tag} className="rounded-lg border border-white/10 bg-white/10 p-3">
                      <p className={`mb-1 text-xs font-medium ${ins.tone}`}>{ins.tag}</p>
                      <p className="text-sm text-background/80">{ins.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`${card} flex-1 p-5`}>
                <h3 className="mb-4 text-sm font-bold">Top award categories</h3>
                <div className="flex flex-col gap-3">
                  {CATEGORIES.map((c) => (
                    <div key={c.name}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold">{c.name}</span>
                        <span>{c.count}</span>
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
                <h3 className="font-semibold">Recognition distribution</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-medium">Group</th>
                      <th className="px-6 py-3 font-medium">Recognitions</th>
                      <th className="px-6 py-3 font-medium">Engagement</th>
                      <th className="px-6 py-3 font-medium">Top contributor</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {DISTRIBUTION.map((d) => (
                      <tr key={d.dept} className="hover:bg-muted/30">
                        <td className="px-6 py-3 font-semibold">{d.dept}</td>
                        <td className="px-6 py-3">{d.recognitions}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span>{d.rate}%</span>
                            <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-success" style={{ width: `${d.rate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{d.top}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${d.tone === "success" ? "bg-success/10 text-success" : "bg-accent text-primary"}`}>
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
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Usage analytics — seats, generation volume and active users — appear here as your team grows.</CardContent>
          </Card>
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
