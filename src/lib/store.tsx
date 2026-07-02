import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { VERTICALS, parseRecipients, todayUK, type Recipient, type VerticalKey } from "./honor"
import type { CustomLayout } from "./custom-templates"
import { useAuth } from "./auth"
import { fetchOrganisation, updateOrganisation } from "./org"

const STORAGE_KEY = "honorhub.v1"

interface PersistShape {
  vertical: VerticalKey
  template: string
  accent: string
  logo: string | null
  logoScale: number
  logoX: number
  logoY: number
  org: string
  award: string
  defaultReason: string
  signatory: string
  date: string
}

export interface HonorState extends PersistShape {
  recipientsRaw: string
  recipients: Recipient[]
  packKey: string | null
  // Set only while an uploaded template is active (template === "custom").
  customLayout: CustomLayout | null
  setVertical: (v: VerticalKey) => void
  setTemplate: (t: string) => void
  setCustomTemplate: (layout: CustomLayout) => void
  setAccent: (a: string) => void
  setLogo: (l: string | null) => void
  setLogoAdjust: (patch: Partial<Pick<PersistShape, "logoScale" | "logoX" | "logoY">>) => void
  setField: (k: "org" | "award" | "defaultReason" | "signatory" | "date", v: string) => void
  setRecipientsRaw: (raw: string) => void
  clearRecipients: () => void
  setPack: (k: string | null) => void
  loadSchoolDemo: () => void
}

const SEED_RECIPIENTS = `Amelia Cole — for beautiful, careful handwriting all week
Noah Bryant — for being a kind and helpful friend
Priya Shah — for fantastic ideas in our science lesson
Leo Walsh — for never giving up on tricky maths
Grace Owusu — for reading with wonderful expression`

const SCHOOL_DEMO_RECIPIENTS = `Amelia Cole — for beautiful, careful handwriting all week
Noah Bryant — for being a kind and helpful friend
Priya Shah — for fantastic ideas in our science lesson
Leo Walsh — for never giving up on tricky maths
Grace Owusu — for reading with wonderful expression`

const SCHOOL_DEMO_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%232d7f5e'/%3E%3Cstop offset='1' stop-color='%23c8a96a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='80' cy='80' r='72' fill='%23fffaf0' stroke='url(%23g)' stroke-width='8'/%3E%3Cpath d='M80 30 124 52v34c0 28-18 44-44 52-26-8-44-24-44-52V52l44-22Z' fill='%232d7f5e'/%3E%3Cpath d='M55 78h50v35H55z' fill='%23fffaf0'/%3E%3Cpath d='M50 72h60L80 50 50 72Z' fill='%23c8a96a'/%3E%3Cpath d='M64 84h32M64 96h32M64 108h22' stroke='%232d7f5e' stroke-width='5' stroke-linecap='round'/%3E%3Ctext x='80' y='145' text-anchor='middle' font-family='Arial,sans-serif' font-size='12' font-weight='700' fill='%232d7f5e'%3EGREENFIELD%3C/text%3E%3C/svg%3E"

const HonorContext = createContext<HonorState | null>(null)

function loadPersisted(): Partial<PersistShape> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {}
  } catch {
    return {}
  }
}

export function HonorProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted()
  const seed = VERTICALS[persisted.vertical ?? "school"]

  const [vertical, setVerticalState] = useState<VerticalKey>(persisted.vertical ?? "school")
  // "custom" is never a persisted default — an uploaded template must be re-selected.
  const [template, setTemplateRaw] = useState(persisted.template && persisted.template !== "custom" ? persisted.template : "laurel")
  const [customLayout, setCustomLayout] = useState<CustomLayout | null>(null)
  const [accent, setAccent] = useState(persisted.accent ?? "#F58220")
  const [logo, setLogoState] = useState<string | null>(persisted.logo ?? null)
  const [logoScale, setLogoScale] = useState(persisted.logoScale ?? 100)
  const [logoX, setLogoX] = useState(persisted.logoX ?? 0)
  const [logoY, setLogoY] = useState(persisted.logoY ?? 0)
  const [org, setOrg] = useState(persisted.org ?? seed.org)
  const [award, setAward] = useState(persisted.award ?? seed.award)
  const [defaultReason, setDefaultReason] = useState(persisted.defaultReason ?? seed.reason)
  const [signatory, setSignatory] = useState(persisted.signatory ?? seed.signatory)
  const [date, setDate] = useState(persisted.date || todayUK())
  // Recipients are session-only by design — never persisted.
  const [recipientsRaw, setRecipientsRaw] = useState(SEED_RECIPIENTS)
  const [packKey, setPack] = useState<string | null>(null)

  const { configured, activeOrgId } = useAuth()
  const hydratedOrgRef = useRef<string | null>(null)

  const setField = (k: "org" | "award" | "defaultReason" | "signatory" | "date", v: string) => {
    if (k === "org") setOrg(v)
    else if (k === "award") setAward(v)
    else if (k === "defaultReason") setDefaultReason(v)
    else if (k === "signatory") setSignatory(v)
    else setDate(v)
  }

  const setLogo = (l: string | null) => {
    setLogoState(l)
    if (!l) {
      setLogoScale(100)
      setLogoX(0)
      setLogoY(0)
    }
  }

  const setLogoAdjust = (patch: Partial<Pick<PersistShape, "logoScale" | "logoX" | "logoY">>) => {
    if (typeof patch.logoScale === "number") setLogoScale(patch.logoScale)
    if (typeof patch.logoX === "number") setLogoX(patch.logoX)
    if (typeof patch.logoY === "number") setLogoY(patch.logoY)
  }

  const setVertical = (v: VerticalKey) => {
    const def = VERTICALS[v]
    setVerticalState(v)
    setOrg(def.org)
    setAward(def.award)
    setDefaultReason(def.reason)
    setSignatory(def.signatory)
  }

  const clearRecipients = () => setRecipientsRaw("")

  // Selecting a built-in template clears any active uploaded template.
  const setTemplate = (t: string) => {
    setTemplateRaw(t)
    if (t !== "custom") setCustomLayout(null)
  }
  const setCustomTemplate = (layout: CustomLayout) => {
    setCustomLayout(layout)
    setTemplateRaw("custom")
  }

  const loadSchoolDemo = () => {
    setVerticalState("school")
    setOrg("Greenfield Community Primary School")
    setAward("Star of the Week")
    setDefaultReason("for showing kindness, effort and curiosity in class")
    setSignatory("Mrs Hart · Class 3")
    setDate(todayUK())
    setTemplate("imperial")
    setAccent("#C8A96A")
    setLogoState(SCHOOL_DEMO_LOGO)
    setLogoScale(92)
    setLogoX(0)
    setLogoY(-2)
    setRecipientsRaw(SCHOOL_DEMO_RECIPIENTS)
    setPack(null)
  }

  // Persist org-level settings (not recipients) per the bible's privacy stance.
  useEffect(() => {
    const data: PersistShape = { vertical, template, accent, logo, logoScale, logoX, logoY, org, award, defaultReason, signatory, date }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* ignore quota errors */
    }
  }, [vertical, template, accent, logo, logoScale, logoX, logoY, org, award, defaultReason, signatory, date])

  // When signed in, the active organisation is the source of truth for org-level
  // settings: hydrate them on load / org switch, then persist edits back (debounced).
  // hydratedOrgRef guards against writing one org's values onto another during a switch.
  useEffect(() => {
    if (!configured || !activeOrgId) {
      hydratedOrgRef.current = null
      return
    }
    hydratedOrgRef.current = null
    let cancelled = false
    fetchOrganisation(activeOrgId).then((o) => {
      if (cancelled || !o) return
      const def = VERTICALS[o.vertical] ?? VERTICALS.school
      setVerticalState(o.vertical)
      setOrg(o.name)
      setAccent(o.accent)
      setTemplate(o.template && o.template !== "custom" ? o.template : "laurel")
      setLogoState(o.logo_url)
      setAward(o.default_award ?? def.award)
      setDefaultReason(o.default_reason ?? def.reason)
      setSignatory(o.default_signatory ?? def.signatory)
      hydratedOrgRef.current = o.id
    })
    return () => {
      cancelled = true
    }
  }, [configured, activeOrgId])

  useEffect(() => {
    if (!configured || !activeOrgId || hydratedOrgRef.current !== activeOrgId) return
    const t = setTimeout(() => {
      void updateOrganisation(activeOrgId, {
        name: org,
        vertical,
        accent,
        logo_url: logo,
        // Don't persist "custom" as the org default — it can't be re-hydrated without the layout.
        ...(template !== "custom" ? { template } : {}),
        default_award: award,
        default_reason: defaultReason,
        default_signatory: signatory,
      })
    }, 800)
    return () => clearTimeout(t)
  }, [configured, activeOrgId, org, vertical, accent, logo, template, award, defaultReason, signatory])

  const recipients = useMemo(() => parseRecipients(recipientsRaw, defaultReason), [recipientsRaw, defaultReason])

  const value: HonorState = {
    vertical,
    template,
    accent,
    logo,
    logoScale,
    logoX,
    logoY,
    org,
    award,
    defaultReason,
    signatory,
    date,
    recipientsRaw,
    recipients,
    packKey,
    customLayout,
    setVertical,
    setTemplate,
    setCustomTemplate,
    setAccent,
    setLogo,
    setLogoAdjust,
    setField,
    setRecipientsRaw,
    clearRecipients,
    setPack,
    loadSchoolDemo,
  }

  return <HonorContext.Provider value={value}>{children}</HonorContext.Provider>
}

export function useHonor(): HonorState {
  const ctx = useContext(HonorContext)
  if (!ctx) throw new Error("useHonor must be used within HonorProvider")
  return ctx
}
