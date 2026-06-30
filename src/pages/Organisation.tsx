import { useState, useEffect } from "react"
import { UserPlus, TrendingUp, Search, Filter, ShieldCheck, Award as AwardIcon, BarChart3, User, Sparkles, Plus, Users as UsersIcon, Trash2, Loader2, Copy, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useHonor } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { VERTICALS } from "@/lib/honor"
import { listSignatories, addSignatory, setSignatoryActive, deleteSignatory } from "@/lib/org"
import { listInvites, createInvite, revokeInvite, inviteLink } from "@/lib/invites"
import { listMembers, updateMemberRole, removeMember, type Member } from "@/lib/members"
import type { Signatory, Invite, Role } from "@/lib/db-types"

const USERS = [
  { name: "Sarah Jenkins", email: "s.jenkins@oakfield.sch.uk", role: "Admin", group: "Leadership", active: "2 mins ago", initials: "SJ" },
  { name: "Marcus Rodriguez", email: "m.rodriguez@oakfield.sch.uk", role: "Manager", group: "Year 4", active: "Yesterday", initials: "MR" },
  { name: "Li Wei", email: "l.wei@oakfield.sch.uk", role: "Contributor", group: "Year 3", active: "3 days ago", initials: "LW" },
  { name: "Amara Okafor", email: "a.okafor@oakfield.sch.uk", role: "Manager", group: "Reception", active: "1 hour ago", initials: "AO" },
]

const ROLES = [
  { key: "admin", name: "Administrator", icon: ShieldCheck, blurb: "Full access to all settings and user management." },
  { key: "manager", name: "Recognition Manager", icon: AwardIcon, blurb: "Manage awards, templates and approve recognitions." },
  { key: "viewer", name: "Reports Viewer", icon: BarChart3, blurb: "Access to all data reports and analytics." },
  { key: "user", name: "Standard User", icon: User, blurb: "Default role. Send and receive recognition." },
]

const PERMISSIONS = [
  {
    group: "Recognition & Awards",
    items: [
      { label: "Create recognition", desc: "Send awards to colleagues", on: true },
      { label: "Manage award templates", desc: "Edit visual styles and criteria", on: true },
      { label: "Approve high-value rewards", desc: "Authorise financial-linked recognitions", on: true },
    ],
  },
  {
    group: "Organisation management",
    items: [
      { label: "Invite & remove members", desc: "Manage the user directory", on: true },
      { label: "Manage billing", desc: "Access invoices and payment methods", on: false },
    ],
  },
  {
    group: "Data & reports",
    items: [
      { label: "Access executive reports", desc: "View cultural analytics and ROI", on: true },
      { label: "Export raw data", desc: "Download all system data", on: false },
    ],
  },
]

const DEMO_SIGNATORIES = [
  { name: "Mr James Wilson", role: "Headteacher", on: true },
  { name: "Mrs Sarah Johnson", role: "Deputy Head", on: true },
  { name: "Mr David Brown", role: "Sports Coach", on: true },
  { name: "Mrs Emily Taylor", role: "Class Teacher", on: false },
]

// Per-vertical "group" terminology (PRD v1.1 §6)
const GROUP_EXAMPLES: Record<string, string[]> = {
  school: ["Year 3", "Year 4", "Reception", "Class 3H"],
  church: ["Choir", "Youth", "Volunteers", "Worship Team"],
  sports: ["U10", "U12", "First Team", "Academy"],
  company: ["Finance", "Sales", "Engineering", "People Ops"],
  charity: ["Fundraising", "Outreach", "Trustees", "Volunteers"],
  event: ["Speakers", "Volunteers", "Sponsors", "Committee"],
}

export default function Organisation() {
  const { org, vertical } = useHonor()
  const { configured, activeOrgId } = useAuth()
  const v = VERTICALS[vertical]
  const [activeRole, setActiveRole] = useState("admin")
  const [inviteOpen, setInviteOpen] = useState(false)

  const onInvite = () => {
    if (configured && activeOrgId) setInviteOpen(true)
    else toast("Sign in to invite", { description: "Invitations add members to your organisation." })
  }
  const groups = GROUP_EXAMPLES[vertical] ?? GROUP_EXAMPLES.school

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Organisation</h1>
          <p className="mt-1 text-muted-foreground">Manage your team, roles, groups and signatories — {org}.</p>
        </div>
        <Button className="font-semibold" onClick={onInvite}>
          <UserPlus className="size-4" /> Invite new user
        </Button>
      </div>

      {activeOrgId && <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} orgId={activeOrgId} />}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Permissions</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="signatories">Signatories</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* ---------------- Users ---------------- */}
        <TabsContent value="users" className="mt-6 flex flex-col gap-6">
          <MembersTab />
        </TabsContent>

        {/* ---------------- Roles & Permissions ---------------- */}
        <TabsContent value="roles" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
              <Card className="overflow-hidden p-0">
                <div className="border-b bg-muted/40 p-4">
                  <h3 className="font-semibold">Available roles</h3>
                </div>
                <div className="flex flex-col">
                  {ROLES.map((r) => {
                    const active = activeRole === r.key
                    return (
                      <button
                        key={r.key}
                        onClick={() => setActiveRole(r.key)}
                        className={`flex items-start gap-3 border-l-4 p-4 text-left transition-colors ${
                          active ? "border-primary bg-accent/40" : "border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <r.icon className={`mt-0.5 size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <div className={`text-sm ${active ? "font-bold" : "font-medium"}`}>{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.blurb}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Card>
              <div className="flex gap-3 rounded-xl border border-primary/20 bg-accent/40 p-4">
                <Sparkles className="size-5 shrink-0 text-primary" />
                <div>
                  <h4 className="text-sm font-bold text-primary">AI recommendation</h4>
                  <p className="text-xs text-muted-foreground">Consider a "Team Lead" role to delegate local approvals while keeping global oversight.</p>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b bg-muted/40 p-5">
                  <div>
                    <h3 className="font-semibold">Permissions: {ROLES.find((r) => r.key === activeRole)?.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Configure what this role can see and do.</p>
                  </div>
                  <Button onClick={() => toast.success("Permissions saved", { description: `${ROLES.find((r) => r.key === activeRole)?.name} updated.` })}>
                    Save changes
                  </Button>
                </div>
                <div className="divide-y">
                  {PERMISSIONS.map((cat) => (
                    <div key={cat.group} className="p-5">
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">{cat.group}</h4>
                      <div className="flex flex-col gap-3">
                        {cat.items.map((it) => (
                          <div key={it.label} className="flex items-center justify-between py-1">
                            <div>
                              <p className="text-sm font-medium">{it.label}</p>
                              <p className="text-xs text-muted-foreground">{it.desc}</p>
                            </div>
                            <Switch defaultChecked={it.on} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Groups ---------------- */}
        <TabsContent value="groups" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Groups adapt to your workspace — for {v.label.toLowerCase()}, that means {groups.slice(0, 2).join(", ")}…
            </p>
            <Button variant="outline" onClick={() => toast("New group", { description: "Custom groups are coming soon." })}>
              <Plus className="size-4" /> New group
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((g) => (
              <Card key={g}>
                <CardContent className="p-5">
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                    <UsersIcon className="size-5" />
                  </span>
                  <h3 className="mt-3 font-semibold">{g}</h3>
                  <p className="text-xs text-muted-foreground">{12 + g.length} members</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---------------- Signatories ---------------- */}
        <TabsContent value="signatories" className="mt-6">
          <SignatoriesPanel />
        </TabsContent>

        {/* ---------------- Privacy ---------------- */}
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardContent className="p-6 text-sm leading-relaxed">
              <h3 className="text-base font-bold">Privacy by default</h3>
              <p className="mt-2 text-muted-foreground">
                Recipient names and messages are <strong className="text-foreground">session-only</strong> — kept in the browser, never stored on our servers, and cleared when you finish. Organisation settings and branding are saved.
              </p>
              <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="font-semibold">Recipient Directory</Label>
                  <p className="text-xs text-muted-foreground">Opt in to store recipients and build a Recognition Timeline.</p>
                </div>
                <Switch
                  onCheckedChange={(on) =>
                    toast(on ? "Recipient Directory enabled" : "Recipient Directory disabled", {
                      description: on
                        ? "Recipients will be stored to build a Recognition Timeline. This changes your privacy posture."
                        : "Recipients stay session-only — never stored.",
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[1]?.[0] ?? parts[0]?.[0] ?? "?")).toUpperCase()
}

const MEMBER_ROLES: { key: Role; label: string }[] = [
  { key: "admin", label: "Administrator" },
  { key: "manager", label: "Manager" },
  { key: "contributor", label: "Contributor" },
  { key: "viewer", label: "Viewer" },
]
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

function MembersTab() {
  const { configured, activeOrgId, user } = useAuth()
  const live = configured && Boolean(activeOrgId)

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(live)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!live || !activeOrgId) return
    let cancelled = false
    setLoading(true)
    listMembers(activeOrgId).then((data) => {
      if (!cancelled) {
        setMembers(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [live, activeOrgId])

  const q = query.trim().toLowerCase()
  const visible = members.filter((m) => `${m.full_name ?? ""} ${m.email ?? ""}`.toLowerCase().includes(q))

  const changeRole = async (m: Member, role: Role) => {
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, role } : x)))
    const ok = await updateMemberRole(m.id, role)
    if (ok) toast.success(`${m.full_name ?? m.email} is now ${role}`)
    else toast.error("Couldn't update role", { description: "Admins/managers only." })
  }

  const remove = async (m: Member) => {
    setMembers((list) => list.filter((x) => x.id !== m.id))
    const ok = await removeMember(m.id)
    if (ok) toast.success(`${m.full_name ?? m.email} removed`)
    else toast.error("Couldn't remove member")
  }

  const total = live ? members.length : USERS.length
  const demoUsers = USERS.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q))

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex items-start gap-4 rounded-xl border border-secondary/20 bg-accent/40 p-4 lg:col-span-2">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h4 className="font-semibold">Understanding user roles</h4>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Roles determine what users can do. Administrators manage the whole organisation; Managers approve recognitions for their group only.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col justify-center p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total members</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-primary">{total}</span>
              {!live && (
                <span className="flex items-center text-sm font-medium text-success">
                  <TrendingUp className="size-4" /> +8%
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{live ? "In this organisation" : "Active this month"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter members…" className="pl-9" />
            </div>
            <Button variant="outline" onClick={() => toast("Filters", { description: "Filter by role and activity — coming soon." })}>
              <Filter className="size-4" /> Filters
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">{live ? `${visible.length} of ${total}` : `Showing ${demoUsers.length} of 124`}</span>
        </div>

        {live && loading ? (
          <div className="grid place-items-center p-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">{live ? "Joined" : "Group"}</th>
                  {!live && <th className="px-6 py-3 font-medium">Last active</th>}
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {live
                  ? visible.map((m) => {
                      const isSelf = m.user_id === user?.id
                      const name = m.full_name ?? m.email ?? "Member"
                      return (
                        <tr key={m.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarFallback className="bg-accent text-xs font-bold text-primary">{initials(name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-semibold">
                                {name}
                                {isSelf && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">YOU</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">{m.email}</td>
                          <td className="px-6 py-3">
                            <Select value={m.role} onValueChange={(v) => changeRole(m, v as Role)}>
                              <SelectTrigger className="h-8 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MEMBER_ROLES.map((r) => (
                                  <SelectItem key={r.key} value={r.key}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">{fmtDate(m.created_at)}</td>
                          <td className="px-6 py-3 text-right">
                            <button
                              disabled={isSelf}
                              onClick={() => remove(m)}
                              className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`Remove ${name}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  : demoUsers.map((u) => (
                      <tr key={u.email} className="transition-colors hover:bg-muted/30">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-accent text-xs font-bold text-primary">{u.initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${u.role === "Admin" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{u.group}</td>
                        <td className="px-6 py-3 text-muted-foreground">{u.active}</td>
                        <td className="px-6 py-3" />
                      </tr>
                    ))}
              </tbody>
            </table>
            {live && visible.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No members match your search.</p>}
          </div>
        )}
      </Card>
    </>
  )
}

const INVITE_ROLES: { key: Role; label: string }[] = [
  { key: "admin", label: "Administrator" },
  { key: "manager", label: "Manager" },
  { key: "contributor", label: "Contributor" },
  { key: "viewer", label: "Viewer" },
]

function InviteSheet({ open, onOpenChange, orgId }: { open: boolean; onOpenChange: (v: boolean) => void; orgId: string }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("contributor")
  const [creating, setCreating] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    listInvites(orgId).then((data) => {
      if (!cancelled) {
        setInvites(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, orgId])

  const copy = (token: string) => {
    navigator.clipboard?.writeText(inviteLink(token))
    toast.success("Invite link copied", { description: "Share it with the person you're inviting." })
  }

  const create = async () => {
    const e = email.trim()
    if (!e) return
    setCreating(true)
    const inv = await createInvite(orgId, e, role)
    setCreating(false)
    if (inv) {
      setInvites((list) => [inv, ...list])
      setEmail("")
      copy(inv.token)
    } else {
      toast.error("Couldn't create invite", { description: "You need an admin/manager role." })
    }
  }

  const revoke = async (id: string) => {
    setInvites((list) => list.filter((i) => i.id !== id))
    await revokeInvite(id)
    toast.success("Invite revoked")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite a teammate</SheetTitle>
          <SheetDescription>Create an invite link and share it. They join this organisation when they sign up.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 py-5">
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@school.org" onKeyDown={(e) => e.key === "Enter" && create()} />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITE_ROLES.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={create} disabled={creating || !email.trim()} className="font-semibold">
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Create invite link
          </Button>
        </div>

        <div className="border-t px-4 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending invites</p>
          {loading ? (
            <div className="grid place-items-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : invites.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No pending invites.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center gap-2 rounded-lg border p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">{i.role}</p>
                  </div>
                  <button onClick={() => copy(i.token)} className="text-muted-foreground hover:text-primary" aria-label="Copy invite link">
                    <Copy className="size-4" />
                  </button>
                  <button onClick={() => revoke(i.id)} className="text-muted-foreground hover:text-destructive" aria-label="Revoke invite">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SignatoriesPanel() {
  const { configured, activeOrgId } = useAuth()
  const live = configured && Boolean(activeOrgId)

  const [rows, setRows] = useState<Signatory[]>([])
  const [loading, setLoading] = useState(live)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!live || !activeOrgId) return
    let cancelled = false
    setLoading(true)
    listSignatories(activeOrgId).then((data) => {
      if (!cancelled) {
        setRows(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [live, activeOrgId])

  async function add() {
    if (!activeOrgId || !name.trim()) return
    setSaving(true)
    const created = await addSignatory(activeOrgId, name.trim(), role.trim())
    setSaving(false)
    if (created) {
      setRows((r) => [...r, created])
      setName("")
      setRole("")
      toast.success("Signatory added")
    } else {
      toast.error("Couldn't add signatory")
    }
  }

  async function toggle(s: Signatory, next: boolean) {
    setRows((r) => r.map((x) => (x.id === s.id ? { ...x, active: next } : x)))
    await setSignatoryActive(s.id, next)
  }

  async function remove(s: Signatory) {
    setRows((r) => r.filter((x) => x.id !== s.id))
    await deleteSignatory(s.id)
    toast.success("Signatory removed")
  }

  // Demo mode — no backend: show the sample list read-only.
  if (!live) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-1 p-2">
          {DEMO_SIGNATORIES.map((s) => (
            <div key={s.name} className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50">
              <Avatar className="size-9">
                <AvatarFallback className="bg-accent font-bold text-primary">{initials(s.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.role}</div>
              </div>
              <span className="font-serif italic text-muted-foreground">{s.name}</span>
              <Switch defaultChecked={s.on} />
            </div>
          ))}
          <p className="px-3 py-2 text-xs text-muted-foreground">Sign in to manage your organisation's signatories.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mr James Wilson" />
          </div>
          <div className="grid flex-1 gap-1.5">
            <Label>Role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Headteacher" onKeyDown={(e) => e.key === "Enter" && add()} />
          </div>
          <Button onClick={add} disabled={saving || !name.trim()} className="font-semibold">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-1 p-2">
          {loading ? (
            <div className="grid place-items-center p-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No signatories yet — add your first above.</p>
          ) : (
            rows.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-accent font-bold text-primary">{initials(s.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.role}</div>
                </div>
                <span className="hidden font-serif italic text-muted-foreground sm:inline">{s.name}</span>
                <Switch checked={s.active} onCheckedChange={(v) => toggle(s, v)} />
                <button onClick={() => remove(s)} className="text-muted-foreground hover:text-destructive" aria-label="Remove signatory">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
