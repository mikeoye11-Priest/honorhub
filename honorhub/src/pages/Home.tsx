import { useNavigate } from "react-router-dom"
import {
  Trophy,
  BadgeCheck,
  Star,
  TrendingUp,
  Sparkles,
  Users,
  PartyPopper,
  Cake,
  RefreshCw,
  ArrowRight,
  Award,
  FileText,
  Plus,
  UserPlus,
  Eye,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useHonor } from "@/lib/store"
import { VERTICALS } from "@/lib/honor"

const KPIS = [
  { label: "Total Recognitions", value: "1,284", delta: "+12%", trend: "up" as const, icon: Trophy, tint: "bg-accent text-primary" },
  { label: "Recent Certificates", value: "42", delta: "+5%", trend: "up" as const, icon: BadgeCheck, tint: "bg-info/10 text-info" },
  { label: "Active Awards", value: "18", delta: "Stable", trend: "flat" as const, icon: Star, tint: "bg-warning/10 text-warning" },
]

const EVENTS = [
  { day: "OCT", date: "14", who: "David Chen", what: "Work Anniversary (5 Years)", icon: PartyPopper, tint: "bg-accent text-primary" },
  { day: "OCT", date: "18", who: "Maria Garcia", what: "Birthday Celebration", icon: Cake, tint: "bg-info/10 text-info" },
  { day: "OCT", date: "22", who: "Team Quarterly", what: "Recognition Ceremony", icon: CalendarDays, tint: "bg-muted text-muted-foreground" },
]

const ACTIVITY = [
  {
    who: "Jessica Wu",
    action: "recognised",
    target: "Kevin Smith",
    quote: "Amazing work on the Q3 audit — your attention to detail saved us weeks of rework.",
    tags: ["Quality Star", "Audit Team"],
    when: "2h ago",
    kind: "person" as const,
    initials: "JW",
  },
  {
    who: "New Milestone Reached",
    action: "",
    target: "",
    quote: "Engineering has reached 500 total recognitions — a celebratory lunch certificate was issued.",
    tags: [] as string[],
    when: "5h ago",
    kind: "milestone" as const,
    initials: "",
  },
  {
    who: "Marcus Thorne",
    action: "created a new",
    target: "Certificate Template",
    quote: "“Q4 Innovation Award” — minimalist design with gold-foil accents.",
    tags: [] as string[],
    when: "Yesterday",
    kind: "person" as const,
    initials: "MT",
  },
]

function HealthDonut({ score }: { score: number }) {
  const r = 58
  const c = 2 * Math.PI * r
  const offset = c * (1 - score / 100)
  return (
    <div className="relative flex size-32 items-center justify-center">
      <svg className="size-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="transparent" stroke="var(--muted)" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="transparent"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-primary">{score}</span>
        <span className="text-[10px] font-bold text-muted-foreground">OPTIMAL</span>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { vertical } = useHonor()
  const v = VERTICALS[vertical]
  const card = "rounded-xl border bg-card shadow-soft"

  return (
    <div className="mx-auto max-w-7xl">
      {/* Greeting */}
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Good morning, Michael!</h2>
          <p className="mt-1 text-muted-foreground">Let's celebrate someone's achievement today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/create")}>
            <UserPlus className="size-4" /> Add Recipient
          </Button>
          <Button variant="outline" onClick={() => navigate("/library")}>
            <Eye className="size-4" /> View Awards
          </Button>
          <Button onClick={() => navigate("/create")} className="font-semibold shadow-sm">
            <Plus className="size-4" /> Create Recognition
          </Button>
        </div>
      </section>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* KPIs */}
        <div className="col-span-12 grid gap-6 sm:grid-cols-3 lg:col-span-8">
          {KPIS.map((k) => (
            <div key={k.label} className={`${card} flex flex-col justify-between p-5 transition-shadow hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <span className={`grid size-10 place-items-center rounded-full ${k.tint}`}>
                  <k.icon className="size-5" />
                </span>
                <span className={`flex items-center gap-1 text-xs font-bold ${k.trend === "up" ? "text-success" : "text-muted-foreground"}`}>
                  {k.trend === "up" && <TrendingUp className="size-3.5" />} {k.delta}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-tight text-muted-foreground">{k.label}</p>
                <h3 className="mt-1 text-3xl font-extrabold">{k.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Health score */}
        <div className={`${card} col-span-12 flex flex-col items-center justify-center p-6 text-center lg:col-span-4`}>
          <div>
            <h3 className="font-bold">Health Score</h3>
            <p className="text-sm text-muted-foreground">Org activity levels</p>
          </div>
          <div className="mt-4">
            <HealthDonut score={85} />
          </div>
          <p className="mt-5 text-xs italic text-muted-foreground">"Participation is up 15% since last quarter."</p>
        </div>

        {/* AI insights */}
        <div className={`${card} col-span-12 flex flex-col overflow-hidden lg:col-span-8`}>
          <div className="flex items-center justify-between border-b bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h3 className="font-bold">AI Insights</h3>
            </div>
            <span className="rounded bg-accent px-2 py-1 text-[10px] font-bold text-primary">LIVE</span>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {[
              { icon: Users, tint: "text-primary", title: "Missed connection", body: `It's been a while since you recognised your top-performing ${v.label.toLowerCase()} group — they've exceeded expectations this month.` },
              { icon: TrendingUp, tint: "text-warning", title: "Achievement streak", body: "Sarah Jenkins is on a three-month streak. Consider a Top Performer award." },
            ].map((ins) => (
              <button key={ins.title} onClick={() => navigate("/create")} className="rounded-xl border bg-muted/40 p-4 text-left transition-colors hover:border-primary">
                <div className="flex items-start gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full bg-card shadow-sm ${ins.tint}`}>
                    <ins.icon className="size-5" />
                  </span>
                  <div>
                    <p className="mb-1 text-sm font-bold">{ins.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{ins.body}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="px-5 pb-5">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm font-bold text-muted-foreground hover:bg-muted/40">
              <RefreshCw className="size-4" /> Generate new suggestions
            </button>
          </div>
        </div>

        {/* Upcoming events / recognition opportunities */}
        <div className={`${card} col-span-12 p-5 lg:col-span-4`}>
          <h3 className="mb-4 font-bold">Upcoming Events</h3>
          <div className="flex flex-col gap-2">
            {EVENTS.map((e) => (
              <div key={e.who} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                <div className={`flex size-10 flex-col items-center justify-center rounded-lg ${e.tint}`}>
                  <span className="text-[10px] font-bold">{e.day}</span>
                  <span className="text-sm font-bold leading-none">{e.date}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{e.who}</p>
                  <p className="text-xs text-muted-foreground">{e.what}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-primary" aria-label="Recognise" onClick={() => navigate("/create")}>
                  <e.icon className="size-5" />
                </Button>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/reports")} className="mt-5 flex w-full items-center justify-center gap-1 text-sm font-bold text-primary hover:underline">
            View Calendar <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Recent activity timeline */}
        <div className={`${card} col-span-12 p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold">Recent Activity</h3>
            <div className="flex gap-2">
              <button className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">All Activity</button>
              <button className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted">Milestones</button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute bottom-0 left-6 top-0 w-px bg-border" />
            <div className="relative flex flex-col gap-8">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="z-10 grid size-12 shrink-0 place-items-center rounded-full border-4 border-card bg-card shadow-sm">
                    {a.kind === "milestone" ? (
                      <Award className="size-5 text-primary" />
                    ) : (
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-accent text-xs font-bold text-primary">{a.initials}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="flex-1 rounded-xl border bg-card/60 p-4 transition-shadow hover:shadow-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-bold">
                        {a.who} {a.action && <span className="font-normal text-muted-foreground">{a.action}</span>}{" "}
                        {a.target && <span>{a.target}</span>}
                      </p>
                      <span className="text-xs text-muted-foreground">{a.when}</span>
                    </div>
                    <p className="flex items-start gap-2 text-sm italic text-muted-foreground">
                      {a.kind === "milestone" && <FileText className="mt-0.5 size-4 shrink-0 text-primary" />}
                      {a.quote}
                    </p>
                    {a.tags.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {a.tags.map((t) => (
                          <span key={t} className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <button className="rounded-full border px-6 py-2 text-sm font-bold text-muted-foreground hover:bg-muted">Load More Activity</button>
          </div>
        </div>
      </div>

      {/* Floating create button */}
      <button
        onClick={() => navigate("/create")}
        aria-label="Create recognition"
        className="group fixed bottom-8 right-8 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-7" />
      </button>
    </div>
  )
}
