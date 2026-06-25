import { NavLink } from "react-router-dom"
import { Home, Sparkles, BookOpen, Users, BarChart3, Settings, Award } from "lucide-react"
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
import { VERTICAL_LIST, type VerticalKey } from "@/lib/honor"

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
            Workspace
          </label>
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
            <div className="h-full rounded-full bg-primary" style={{ width: "75%" }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">750 / 1000 recognitions used this month.</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
