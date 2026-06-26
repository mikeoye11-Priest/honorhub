import { useState } from "react"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHonor } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { VERTICAL_LIST, type VerticalKey } from "@/lib/honor"
import { getTheme, setTheme, getReduceMotion, setReduceMotion, type Theme } from "@/lib/theme"

const THEMES: { key: Theme; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
]

export default function Settings() {
  const { vertical, setVertical, org, setField } = useHonor()
  const { configured, user } = useAuth()
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [reduceMotion, setReduceMotionState] = useState(getReduceMotion())
  const [fullName, setFullName] = useState((configured && user?.fullName) || "Michael Johnson")
  const [email, setEmail] = useState((configured && user?.email) || "michael@oakfield.sch.uk")

  const chooseTheme = (t: Theme) => {
    setTheme(t)
    setThemeState(t)
  }

  const toggleMotion = (on: boolean) => {
    setReduceMotion(on)
    setReduceMotionState(on)
    toast(on ? "Reduced motion on" : "Reduced motion off", { description: on ? "Animations and success confetti are minimised." : "Animations re-enabled." })
  }

  const saveProfile = () => toast.success("Profile saved", { description: `${fullName} · ${email}` })

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account, organisation and preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organisation">Organisation</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={saveProfile}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organisation" className="mt-6">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="org">Organisation name</Label>
                <Input id="org" value={org} onChange={(e) => setField("org", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Workspace type</Label>
                <Select value={vertical} onValueChange={(v) => setVertical(v as VerticalKey)}>
                  <SelectTrigger>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interface" className="mt-6 flex flex-col gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">Appearance</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose how HonorHub looks on this device.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {THEMES.map((t) => {
                  const active = theme === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => chooseTheme(t.key)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        active ? "border-primary bg-accent ring-1 ring-primary" : "bg-card hover:shadow-sm"
                      }`}
                    >
                      <t.icon className="size-5 text-primary" />
                      <span className="flex-1 font-medium">{t.label}</span>
                      {active && <Check className="size-4 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Label className="font-semibold">Reduce motion</Label>
                <p className="text-xs text-muted-foreground">Minimise animations and the success confetti.</p>
              </div>
              <Switch checked={reduceMotion} onCheckedChange={toggleMotion} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              The AI Recognition Writer adapts its tone to your workspace. Add an <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code> in your
              deployment to enable it. Only achievement notes are sent — never recipient names.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <div className="font-semibold">Professional plan</div>
                <div className="text-sm text-muted-foreground">Unlimited recognitions · all templates</div>
              </div>
              <Button variant="outline" onClick={() => toast("Billing", { description: "Plan management and invoices are coming soon." })}>
                Manage plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
