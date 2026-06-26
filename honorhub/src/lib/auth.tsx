import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { supabase, isSupabaseConfigured } from "./supabase"
import type { Organisation } from "./db-types"
import type { VerticalKey } from "./honor"

interface AuthUser {
  id: string
  email: string | null
  fullName: string | null
}

export interface SignUpInput {
  email: string
  password: string
  fullName: string
  organisationName: string
  vertical: VerticalKey
  inviteToken?: string
}

interface AuthState {
  configured: boolean
  loading: boolean
  authed: boolean
  user: AuthUser | null
  organisations: Organisation[]
  activeOrgId: string | null
  setActiveOrgId: (id: string) => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (input: SignUpInput) => Promise<{ error?: string; needsConfirmation?: boolean }>
  signOut: () => Promise<void>
  refreshOrgs: () => Promise<void>
}

const ACTIVE_ORG_KEY = "honorhub.activeOrg"
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(localStorage.getItem(ACTIVE_ORG_KEY))

  const setActiveOrgId = (id: string) => {
    setActiveOrgIdState(id)
    localStorage.setItem(ACTIVE_ORG_KEY, id)
  }

  async function loadOrgs(uid: string) {
    if (!supabase) return
    const { data } = await supabase
      .from("organisation_memberships")
      .select("role, organisations(*)")
      .eq("user_id", uid)
    const rows = (data ?? []) as Array<{ organisations: Organisation | Organisation[] | null }>
    const orgs = rows
      .map((m) => (Array.isArray(m.organisations) ? m.organisations[0] : m.organisations))
      .filter((o): o is Organisation => Boolean(o))
    setOrganisations(orgs)
    setActiveOrgIdState((cur) => {
      const valid = cur && orgs.some((o) => o.id === cur)
      const next = valid ? cur : (orgs[0]?.id ?? null)
      if (next) localStorage.setItem(ACTIVE_ORG_KEY, next)
      return next
    })
  }

  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const u = data.session?.user
      if (u) {
        setUser({ id: u.id, email: u.email ?? null, fullName: (u.user_metadata?.full_name as string) ?? null })
        await loadOrgs(u.id)
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      if (u) {
        setUser({ id: u.id, email: u.email ?? null, fullName: (u.user_metadata?.full_name as string) ?? null })
        loadOrgs(u.id)
      } else {
        setUser(null)
        setOrganisations([])
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: "Backend not configured" }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }

  const signUp = async (input: SignUpInput) => {
    if (!supabase) return { error: "Backend not configured" }
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          organisation_name: input.organisationName,
          vertical: input.vertical,
          // When present, the signup trigger skips creating a new org — the user
          // joins the inviting org via accept_invite() instead.
          invite_token: input.inviteToken ?? "",
        },
      },
    })
    if (error) return { error: error.message }
    // Email confirmation on → no session yet
    return { needsConfirmation: !data.session }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setOrganisations([])
  }

  const refreshOrgs = async () => {
    if (user) await loadOrgs(user.id)
  }

  const value: AuthState = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      // Demo mode (no backend): treat as authed so the public demo renders with no login wall.
      authed: isSupabaseConfigured ? Boolean(user) : true,
      user,
      organisations,
      activeOrgId,
      setActiveOrgId,
      signIn,
      signUp,
      signOut,
      refreshOrgs,
    }),
    [loading, user, organisations, activeOrgId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
