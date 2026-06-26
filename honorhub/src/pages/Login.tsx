import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Award, Loader2, MailCheck, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { acceptInvite } from "@/lib/invites"
import { VERTICAL_LIST, type VerticalKey } from "@/lib/honor"

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteToken = params.get("invite") || undefined
  const { signIn, signUp, authed, refreshOrgs, setActiveOrgId } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">(inviteToken ? "signup" : "signin")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [orgName, setOrgName] = useState("")
  const [vertical, setVertical] = useState<VerticalKey>("school")

  // Join the invited org (after auth) and route in.
  async function afterAuth() {
    if (inviteToken) {
      const orgId = await acceptInvite(inviteToken)
      await refreshOrgs()
      if (orgId) {
        setActiveOrgId(orgId)
        toast.success("You've joined the workspace")
      } else {
        toast("Invite could not be applied", { description: "It may have been revoked or already used." })
      }
    }
    navigate("/")
  }

  // Already signed in and arriving via an invite link → accept and continue.
  useEffect(() => {
    if (authed && inviteToken) void afterAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, inviteToken])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password)
        if (error) setError(error)
        else await afterAuth()
      } else {
        const { error, needsConfirmation } = await signUp({ email, password, fullName, organisationName: orgName, vertical, inviteToken })
        if (error) setError(error)
        else if (needsConfirmation) setConfirm(true)
        else await afterAuth()
      }
    } finally {
      setBusy(false)
    }
  }

  if (confirm) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/15 text-success">
            <MailCheck className="size-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Check your email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We've sent a confirmation link to <strong>{email}</strong>. Confirm it, then sign in.
          </p>
          <Button className="mt-5 w-full" onClick={() => { setConfirm(false); setMode("signin") }}>
            Back to sign in
          </Button>
        </div>
      </Shell>
    )
  }

  const joining = Boolean(inviteToken)

  return (
    <Shell>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold">
          {joining ? "Join the workspace" : mode === "signin" ? "Welcome back" : "Create your workspace"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {joining
            ? "You've been invited to a HonorHub workspace."
            : mode === "signin"
              ? "Sign in to your HonorHub workspace."
              : "Start recognising achievement in minutes."}
        </p>
      </div>

      {joining && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-accent/40 p-3 text-sm">
          <Mail className="size-4 shrink-0 text-primary" />
          <span>{mode === "signup" ? "Create your account to join." : "Sign in to join."}</span>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <>
            <Field label="Your name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Michael Johnson" />
            </Field>
            {/* Organisation fields only when creating a new workspace — invitees join an existing one */}
            {!joining && (
              <>
                <Field label="Organisation name">
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="Oakfield Primary School" />
                </Field>
                <Field label="Workspace type">
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
                </Field>
              </>
            )}
          </>
        )}
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@school.org" />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" disabled={busy} className="mt-1 font-semibold">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create workspace"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New to HonorHub?" : "Already have an account?"}{" "}
        <button
          className="font-semibold text-primary hover:underline"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null) }}
        >
          {mode === "signin" ? "Create a workspace" : "Sign in"}
        </button>
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Award className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-extrabold">HonorHub</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Recognition</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-soft">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
