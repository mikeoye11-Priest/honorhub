import { useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Bell, Sparkles, Search, HelpCircle, PartyPopper, TrendingUp, Check, Settings as SettingsIcon, LogOut, CheckCheck } from "lucide-react"
import { toast } from "sonner"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppSidebar } from "@/components/app-sidebar"
import { useHonor } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { useExportAnalytics, type Insight } from "@/lib/exports"
import { VERTICALS } from "@/lib/honor"

const TITLES: Record<string, string> = {
  "/": "Home",
  "/create": "Create Recognition",
  "/library": "Library",
  "/organisation": "Organisation",
  "/reports": "Reports",
  "/settings": "Settings",
}

type Notif = { id: string; icon: typeof Bell; tint: string; title: string; body: string; when: string; unread: boolean }

const READ_KEY = "honorhub.readNotifs"
const TONE: Record<Insight["tone"], { icon: typeof Bell; tint: string }> = {
  good: { icon: PartyPopper, tint: "bg-accent text-primary" },
  info: { icon: TrendingUp, tint: "bg-info/10 text-info" },
  warn: { icon: Bell, tint: "bg-warning/10 text-warning" },
}

function loadReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]") as string[])
  } catch {
    return new Set()
  }
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { vertical } = useHonor()
  const { configured, user, signOut } = useAuth()
  const title = TITLES[location.pathname] ?? "HonorHub"
  const brand = VERTICALS[vertical].brand

  const [query, setQuery] = useState("")
  const { analytics, live } = useExportAnalytics()
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)

  // Notifications derived from real recognition activity — no recipient PII, just
  // counts/trends/awards. Read-state is remembered per-browser in localStorage.
  const notifs = useMemo<Notif[]>(() => {
    if (!live || !analytics.hasData) return []
    const items: Omit<Notif, "unread">[] = []
    if (analytics.last7 > 0) {
      items.push({
        id: "weekly",
        icon: TrendingUp,
        tint: "bg-success/10 text-success",
        title: "This week",
        body: `${analytics.last7.toLocaleString()} certificate${analytics.last7 === 1 ? "" : "s"} created in the last 7 days.`,
        when: "This week",
      })
    }
    for (const ins of analytics.insights) {
      const t = TONE[ins.tone]
      items.push({ id: `insight:${ins.tag}`, icon: t.icon, tint: t.tint, title: ins.tag, body: ins.body, when: "Today" })
    }
    return items.map((n) => ({ ...n, unread: !readIds.has(n.id) }))
  }, [live, analytics, readIds])

  const unread = notifs.filter((n) => n.unread).length

  const persistRead = (ids: Set<string>) => {
    setReadIds(new Set(ids))
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
    } catch {
      /* ignore quota errors */
    }
  }
  const markAllRead = () => persistRead(new Set([...readIds, ...notifs.map((n) => n.id)]))
  const openNotif = (id: string) => {
    persistRead(new Set([...readIds, id]))
  }

  const runSearch = () => {
    const q = query.trim()
    if (!q) return
    navigate("/library")
    toast(`Showing the Library — search for “${q}” is coming soon.`)
  }

  const displayName = (configured && user?.fullName) || "Michael Johnson"
  const displayEmail = (configured && user?.email) || "Administrator"
  const initials =
    displayName.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "HH"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <div className="flex flex-col leading-tight">
            <h1 className="text-base font-extrabold text-foreground">{title}</h1>
            <span className="text-xs text-muted-foreground">{brand}</span>
          </div>

          {/* Global search */}
          <div className="relative ml-4 hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search recognitions, people, or awards…"
              className="rounded-full border-0 bg-muted pl-9 focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {location.pathname !== "/create" && (
              <Button onClick={() => navigate("/create")} className="font-semibold">
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">Create Recognition</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label="Help"
              className="text-muted-foreground"
              onClick={() => toast("Help centre", { description: "Guides and support are on the way. Email support@zequence.digital meanwhile." })}
            >
              <HelpCircle className="size-5" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative text-muted-foreground">
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <CheckCheck className="size-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifs.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
                ) : (
                  notifs.map((n) => (
                    <DropdownMenuItem key={n.id} onClick={() => openNotif(n.id)} className="flex items-start gap-3 py-2.5">
                      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${n.tint}`}>
                        <n.icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          {n.title}
                          {n.unread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{n.when}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/reports")} className="justify-center text-sm font-medium text-primary">
                  View all in Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            {/* Profile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="hidden text-right leading-tight lg:block">
                    <p className="text-sm font-bold">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground">{displayEmail}</p>
                  </div>
                  <Avatar className="size-9 border-2 border-accent">
                    <AvatarFallback className="bg-secondary font-bold text-secondary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <SettingsIcon className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/organisation")}>
                  <Check className="size-4" /> Organisation
                </DropdownMenuItem>
                {configured && user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await signOut()
                        navigate("/login")
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-4" /> Sign out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
