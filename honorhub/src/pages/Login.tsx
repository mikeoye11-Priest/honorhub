import { useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Award, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { VERTICAL_LIST, type VerticalKey } from "@/lib/honor"

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [orgName, setOrgName] = useState("")
  const [vertical, setVertical] = useState<VerticalKey>("school")

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password)
        if (error) setError(error)
        else navigate("/")
      } else {
        const { error, needsConfirmation } = await signUp({ email, password, fullName, organisationName: orgName, vertical })
        if (error) setError(error)
        else if (needsConfirmation) setConfirm(true)
        else navigate("/")
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

  return (
    <Shell>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold">{mode === "signin" ? "Welcome back" : "Create your workspace"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to your HonorHub workspace." : "Start recognising achievement in minutes."}
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <>
            <Field label="Your name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Michael Johnson" />
            </Field>
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
