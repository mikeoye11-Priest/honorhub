// HonorHub content catalog — encodes PRD content model (Levels 1–3 + Packs + outputs).
// Frontend seed data: powers visual award cards, Library collections + filters,
// the pack picker, and AI recommendations. Backend persistence comes later (PRD v1.1 §7).

import type { VerticalKey } from "./honor"

/* ---------------- Level 1 — Quick Templates (universal styles) ---------------- */
export interface Style {
  key: string
  name: string
  blurb: string
  engine: string // maps to the certificate engine template key
  built: boolean
}

export const STYLES: Style[] = [
  { key: "classic", name: "Classic", blurb: "Timeless & ceremonial", engine: "laurel", built: true },
  { key: "modern", name: "Modern", blurb: "Clean & contemporary", engine: "meadow", built: true },
  { key: "elegant", name: "Elegant", blurb: "Refined line art", engine: "botanical", built: true },
  { key: "formal", name: "Formal", blurb: "Premium & official", engine: "regal", built: true },
  { key: "premium", name: "Premium", blurb: "Dark & distinguished", engine: "midnight", built: true },
  { key: "minimal", name: "Minimal", blurb: "Stripped-back & calm", engine: "meadow", built: false },
]

/* ---------------- Level 2 — Sector Collections (named awards) ---------------- */
export interface Award {
  name: string
  icon: string
}

export const COLLECTIONS: Record<VerticalKey, Award[]> = {
  school: [
    { name: "Star of the Week", icon: "⭐" },
    { name: "Headteacher's Award", icon: "🎖️" },
    { name: "Reading Champion", icon: "📚" },
    { name: "Maths Excellence", icon: "➗" },
    { name: "Science Award", icon: "🔬" },
    { name: "Sports Day", icon: "🏅" },
    { name: "Perfect Attendance", icon: "🗓️" },
    { name: "Kindness Award", icon: "❤️" },
    { name: "Graduation", icon: "🎓" },
    { name: "End of Term", icon: "🏁" },
    { name: "House Champion", icon: "🏆" },
    { name: "Pupil Leadership", icon: "🧭" },
    { name: "Music Award", icon: "🎵" },
    { name: "Art Excellence", icon: "🎨" },
    { name: "Behaviour Award", icon: "🌟" },
  ],
  church: [
    { name: "Volunteer Appreciation", icon: "🙌" },
    { name: "Faithfulness Award", icon: "🕊️" },
    { name: "Kingdom Service", icon: "✝️" },
    { name: "Pastor Appreciation", icon: "📖" },
    { name: "Children's Ministry", icon: "🧒" },
    { name: "Choir Excellence", icon: "🎶" },
    { name: "Youth Leadership", icon: "🔥" },
    { name: "Missions Recognition", icon: "🌍" },
    { name: "Prayer Team", icon: "🙏" },
    { name: "Evangelism", icon: "📣" },
    { name: "Bible Study Completion", icon: "📜" },
    { name: "Family Appreciation", icon: "👪" },
    { name: "Anniversary Recognition", icon: "🎉" },
    { name: "Thanksgiving", icon: "🌾" },
    { name: "Worker of the Year", icon: "🏆" },
  ],
  sports: [
    { name: "Player of the Match", icon: "⚽" },
    { name: "Most Improved Player", icon: "📈" },
    { name: "Fair Play Award", icon: "🤝" },
    { name: "Top Goal Scorer", icon: "🥅" },
    { name: "Coaches Award", icon: "📋" },
    { name: "Team Spirit", icon: "🙌" },
    { name: "Goalkeeper Excellence", icon: "🧤" },
    { name: "Season Awards", icon: "🏆" },
    { name: "Tournament Winner", icon: "🥇" },
    { name: "Participation", icon: "🎖️" },
  ],
  company: [
    { name: "Employee of the Month", icon: "💼" },
    { name: "Innovation Award", icon: "💡" },
    { name: "Leadership Excellence", icon: "🧭" },
    { name: "Customer Service", icon: "🎧" },
    { name: "Sales Achievement", icon: "📊" },
    { name: "Long Service", icon: "⏳" },
    { name: "Team Excellence", icon: "🤝" },
    { name: "Project Success", icon: "✅" },
    { name: "Safety Award", icon: "🦺" },
    { name: "Company Values", icon: "🏛️" },
  ],
  charity: [
    { name: "Outstanding Volunteer", icon: "🙌" },
    { name: "Community Champion", icon: "🏘️" },
    { name: "Fundraising Hero", icon: "💝" },
    { name: "Years of Service", icon: "⏳" },
    { name: "Partnership Award", icon: "🤝" },
    { name: "Appreciation", icon: "❤️" },
    { name: "Community Impact", icon: "🌱" },
  ],
  event: [
    { name: "Speaker Recognition", icon: "🎤" },
    { name: "Volunteer Award", icon: "🙌" },
    { name: "Sponsor Appreciation", icon: "🤝" },
    { name: "Committee Award", icon: "📋" },
    { name: "Attendee Certificate", icon: "🎟️" },
    { name: "Conference Award", icon: "🏆" },
  ],
}

/* ---------------- Recognition Packs (Template Families) ---------------- */
export type OutputKind = "certificate" | "badge" | "social" | "card" | "banner" | "email"

export interface PackItem {
  label: string
  kind: OutputKind
}

export interface RecognitionPack {
  key: string
  name: string
  sectors: VerticalKey[]
  blurb: string
  items: PackItem[]
  id?: string // present for org-saved packs (DB row id)
  builtIn?: boolean // true for the built-in catalog packs below
}

export const PACKS: RecognitionPack[] = [
  {
    key: "sports-day",
    name: "Sports Day Pack",
    sectors: ["sports", "school"],
    blurb: "Everything for sports day, one consistent style.",
    items: [
      { label: "Winner Certificate", kind: "certificate" },
      { label: "Runner-up Certificate", kind: "certificate" },
      { label: "Participation Certificate", kind: "certificate" },
      { label: "House Champion Certificate", kind: "certificate" },
      { label: "Medal Badge", kind: "badge" },
      { label: "Social Media Graphic", kind: "social" },
      { label: "Printable Award Card", kind: "card" },
    ],
  },
  {
    key: "church-anniversary",
    name: "Church Anniversary Pack",
    sectors: ["church"],
    blurb: "Celebrate the church year with a matched set.",
    items: [
      { label: "Volunteer Certificate", kind: "certificate" },
      { label: "Pastor Appreciation", kind: "certificate" },
      { label: "Choir Recognition", kind: "certificate" },
      { label: "Children's Ministry Award", kind: "certificate" },
      { label: "Event Banner", kind: "banner" },
      { label: "Digital Thank You Card", kind: "card" },
    ],
  },
  {
    key: "graduation",
    name: "Graduation Pack",
    sectors: ["school"],
    blurb: "A complete graduation celebration set.",
    items: [
      { label: "Certificate", kind: "certificate" },
      { label: "Honour Roll", kind: "certificate" },
      { label: "Parent Appreciation", kind: "certificate" },
      { label: "Teacher Appreciation", kind: "certificate" },
      { label: "Student Badge", kind: "badge" },
      { label: "Social Media Announcement", kind: "social" },
    ],
  },
]

export function getPack(key: string | null | undefined): RecognitionPack | undefined {
  return key ? PACKS.find((p) => p.key === key) : undefined
}

/* ---------------- Level 3 — Premium Collections (Marketplace) ---------------- */
export interface PremiumCollection {
  key: string
  name: string
  sectors: VerticalKey[]
  count: number
  price: string
}

export const PREMIUM_COLLECTIONS: PremiumCollection[] = [
  { key: "education", name: "Education Collection", sectors: ["school"], count: 50, price: "£29" },
  { key: "church", name: "Church Collection", sectors: ["church"], count: 75, price: "£39" },
  { key: "corporate", name: "Corporate Collection", sectors: ["company"], count: 100, price: "£49" },
]

/* ---------------- The Recognition Experience (multi-output) ---------------- */
export interface OutputFormat {
  key: string
  label: string
  built: boolean
}

export const OUTPUT_FORMATS: OutputFormat[] = [
  { key: "pdf", label: "Printable PDF", built: true },
  { key: "digital", label: "Digital Certificate", built: true },
  { key: "social", label: "Social Image", built: false },
  { key: "email", label: "Email Version", built: false },
  { key: "qr", label: "QR Verification", built: false },
  { key: "card", label: "Award Card", built: false },
  { key: "badge", label: "Digital Badge", built: false },
]

/* ---------------- AI recommendation (catalog-driven stub) ---------------- */
export function recommendPack(vertical: VerticalKey, eventHint?: string): RecognitionPack | undefined {
  const hint = (eventHint || "").toLowerCase()
  const candidates = PACKS.filter((p) => p.sectors.includes(vertical))
  if (hint) {
    const byHint = candidates.find((p) => p.name.toLowerCase().includes(hint) || p.key.includes(hint))
    if (byHint) return byHint
  }
  return candidates[0]
}
