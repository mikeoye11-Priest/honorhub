import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { VERTICALS, parseRecipients, todayUK, type Recipient, type VerticalKey } from "./honor"

const STORAGE_KEY = "honorhub.v1"

interface PersistShape {
  vertical: VerticalKey
  template: string
  accent: string
  logo: string | null
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
  setVertical: (v: VerticalKey) => void
  setTemplate: (t: string) => void
  setAccent: (a: string) => void
  setLogo: (l: string | null) => void
  setField: (k: "org" | "award" | "defaultReason" | "signatory" | "date", v: string) => void
  setRecipientsRaw: (raw: string) => void
  clearRecipients: () => void
  setPack: (k: string | null) => void
}

const SEED_RECIPIENTS = `Amelia Cole — for beautiful, careful handwriting all week
Noah Bryant — for being a kind and helpful friend
Priya Shah — for fantastic ideas in our science lesson
Leo Walsh — for never giving up on tricky maths
Grace Owusu — for reading with wonderful expression`

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
  const [template, setTemplate] = useState(persisted.template ?? "laurel")
  const [accent, setAccent] = useState(persisted.accent ?? "#F58220")
  const [logo, setLogo] = useState<string | null>(persisted.logo ?? null)
  const [org, setOrg] = useState(persisted.org ?? seed.org)
  const [award, setAward] = useState(persisted.award ?? seed.award)
  const [defaultReason, setDefaultReason] = useState(persisted.defaultReason ?? seed.reason)
  const [signatory, setSignatory] = useState(persisted.signatory ?? seed.signatory)
  const [date, setDate] = useState(persisted.date || todayUK())
  // Recipients are session-only by design — never persisted.
  const [recipientsRaw, setRecipientsRaw] = useState(SEED_RECIPIENTS)
  const [packKey, setPack] = useState<string | null>(null)

  const setField = (k: "org" | "award" | "defaultReason" | "signatory" | "date", v: string) => {
    if (k === "org") setOrg(v)
    else if (k === "award") setAward(v)
    else if (k === "defaultReason") setDefaultReason(v)
    else if (k === "signatory") setSignatory(v)
    else setDate(v)
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

  // Persist org-level settings (not recipients) per the bible's privacy stance.
  useEffect(() => {
    const data: PersistShape = { vertical, template, accent, logo, org, award, defaultReason, signatory, date }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* ignore quota errors */
    }
  }, [vertical, template, accent, logo, org, award, defaultReason, signatory, date])

  const recipients = useMemo(() => parseRecipients(recipientsRaw, defaultReason), [recipientsRaw, defaultReason])

  const value: HonorState = {
    vertical,
    template,
    accent,
    logo,
    org,
    award,
    defaultReason,
    signatory,
    date,
    recipientsRaw,
    recipients,
    packKey,
    setVertical,
    setTemplate,
    setAccent,
    setLogo,
    setField,
    setRecipientsRaw,
    clearRecipients,
    setPack,
  }

  return <HonorContext.Provider value={value}>{children}</HonorContext.Provider>
}

export function useHonor(): HonorState {
  const ctx = useContext(HonorContext)
  if (!ctx) throw new Error("useHonor must be used within HonorProvider")
  return ctx
}
