import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Bell, Sparkles, Search, HelpCircle } from "lucide-react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AppSidebar } from "@/components/app-sidebar"
import { useHonor } from "@/lib/store"
import { VERTICALS } from "@/lib/honor"

const TITLES: Record<string, string> = {
  "/": "Home",
  "/create": "Create Recognition",
  "/library": "Library",
  "/organisation": "Organisation",
  "/reports": "Reports",
  "/settings": "Settings",
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { vertical } = useHonor()
  const title = TITLES[location.pathname] ?? "HonorHub"
  const brand = VERTICALS[vertical].brand

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
            <Button variant="ghost" size="icon" aria-label="Help" className="text-muted-foreground">
              <HelpCircle className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative text-muted-foreground">
              <Bell className="size-5" />
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-white">
                3
              </span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="hidden text-right leading-tight lg:block">
              <p className="text-sm font-bold">Michael Johnson</p>
              <p className="text-[11px] text-muted-foreground">Administrator</p>
            </div>
            <Avatar className="size-9 border-2 border-accent">
              <AvatarFallback className="bg-secondary font-bold text-secondary-foreground">MJ</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
