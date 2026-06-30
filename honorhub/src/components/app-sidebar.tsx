import { NavLink, useNavigate } from "react-router-dom"
import { Home, Sparkles, BookOpen, Users, BarChart3, Settings, Award, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHonor } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { useExportStats } from "@/lib/exports"
import { VERTICAL_LIST, type VerticalKey } from "@/lib/honor"

const PLAN_LIMIT = 1000 // monthly recognition allowance on the Pro plan

// Exactly six primary items — the bible forbids more, and forbids "Certificates"
// as a nav item (it lives inside Create).
const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/create", label: "Create", icon: Sparkles, end: false },
  { to: "/library", label: "Library", icon: BookOpen, end: false },
  { to: "/organisation", label: "Organisation", icon: Users, end: false },
  { to: "/reports", label: "Reports", icon: BarChart3, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
]

export function AppSidebar() {
  const { vertical, setVertical } = useHonor()
  const navigate = useNavigate()
  const { configured, user, organisations, activeOrgId, setActiveOrgId, signOut } = useAuth()
  const liveOrgs = configured && organisations.length > 0
  const { stats, live } = useExportStats()
  const used = live ? stats.last30 : 750
  const usedPct = Math.min(100, Math.round((used / PLAN_LIMIT) * 100))

  // Just switch the active org — the store hydrates vertical + branding from the DB.
  const onPickOrg = (id: string) => setActiveOrgId(id)

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="gap-3 p-4">
        <div className="flex items-center gap-2.5 px-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Award className="size-5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-base font-extrabold">HonorHub</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Recognition</p>
          </div>
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <label className="mb-1.5 block px-1 text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
            {liveOrgs ? "Organisation" : "Workspace"}
          </label>
          {liveOrgs ? (
            <Select value={activeOrgId ?? undefined} onValueChange={onPickOrg}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select organisation" />
              </SelectTrigger>
              <SelectContent>
                {organisations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={vertical} onValueChange={(v) => setVertical(v as VerticalKey)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VERTICAL_LIST.map((v) => (
                  <SelectItem key={v.key} value={v.key}>
                    {v.brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {NAV.map((item) => (
              <SidebarMenuItem key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-10 rounded-lg border-l-[3px] border-transparent font-semibold data-[active=true]:border-primary data-[active=true]:bg-sidebar-accent data-[active=true]:font-bold data-[active=true]:text-sidebar-accent-foreground"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-4 group-data-[collapsible=icon]:hidden">
        <Button asChild className="w-full font-bold shadow-sm">
          <NavLink to="/create">
            <Sparkles className="size-4" /> Create Recognition
          </NavLink>
        </Button>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-bold text-primary">PRO PLAN</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${usedPct}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {used.toLocaleString()} / {PLAN_LIMIT.toLocaleString()} recognitions in the last 30 days.
          </p>
        </div>
        {configured && user && (
          <button
            onClick={async () => {
              await signOut()
              navigate("/login")
            }}
            className="flex items-center gap-2 px-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" /> Sign out
            <span className="ml-auto truncate text-xs text-muted-foreground/70">{user.email}</span>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
