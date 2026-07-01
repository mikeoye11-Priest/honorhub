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
  blurb: string
  count: number
  price: string
  includedIn: string
  bestFor: string[]
  items: PackItem[]
}

export const PREMIUM_COLLECTIONS: PremiumCollection[] = [
  {
    key: "school-end-term",
    name: "School End-of-Term Awards Pack",
    sectors: ["school"],
    blurb: "A complete assembly-ready set for pupil achievement, attendance, kindness and graduation moments.",
    count: 42,
    price: "£49",
    includedIn: "Education Pro",
    bestFor: ["Primary schools", "End of term", "Class awards"],
    items: [
      { label: "Star of the Week Certificate", kind: "certificate" },
      { label: "Maths Excellence Certificate", kind: "certificate" },
      { label: "Reading Champion Certificate", kind: "certificate" },
      { label: "Kindness Award Certificate", kind: "certificate" },
      { label: "Perfect Attendance Certificate", kind: "certificate" },
      { label: "Graduation Certificate", kind: "certificate" },
      { label: "Pupil Badge Sheet", kind: "badge" },
      { label: "Parent Email Wording", kind: "email" },
      { label: "Assembly Social Graphic", kind: "social" },
      { label: "Printable Award Cards", kind: "card" },
    ],
  },
  {
    key: "church-volunteer",
    name: "Church Volunteer Appreciation Pack",
    sectors: ["church"],
    blurb: "Warm certificates and event assets for ministry teams, volunteers, workers and thanksgiving services.",
    count: 36,
    price: "£39",
    includedIn: "Church Pro",
    bestFor: ["Churches", "Volunteer Sunday", "Workers appreciation"],
    items: [
      { label: "Volunteer Appreciation Certificate", kind: "certificate" },
      { label: "Faithfulness Award Certificate", kind: "certificate" },
      { label: "Choir Recognition Certificate", kind: "certificate" },
      { label: "Children's Ministry Certificate", kind: "certificate" },
      { label: "Pastor Appreciation Certificate", kind: "certificate" },
      { label: "Thank You Card", kind: "card" },
      { label: "Service Slide / Banner", kind: "banner" },
      { label: "WhatsApp Share Graphic", kind: "social" },
      { label: "Appreciation Email Wording", kind: "email" },
    ],
  },
  {
    key: "corporate-recognition",
    name: "Corporate Recognition Pack",
    sectors: ["company"],
    blurb: "Professional awards for employee recognition, leadership, innovation, service and team achievement.",
    count: 48,
    price: "£59",
    includedIn: "Organisation Pro",
    bestFor: ["Teams", "HR", "Monthly awards"],
    items: [
      { label: "Employee of the Month Certificate", kind: "certificate" },
      { label: "Leadership Excellence Certificate", kind: "certificate" },
      { label: "Innovation Award Certificate", kind: "certificate" },
      { label: "Customer Service Certificate", kind: "certificate" },
      { label: "Long Service Certificate", kind: "certificate" },
      { label: "LinkedIn Share Graphic", kind: "social" },
      { label: "Digital Badge", kind: "badge" },
      { label: "Manager Email Wording", kind: "email" },
    ],
  },
  {
    key: "sports-presentation",
    name: "Sports Presentation Night Pack",
    sectors: ["sports", "school"],
    blurb: "A full club presentation set for end-of-season awards, match recognition and participation.",
    count: 34,
    price: "£49",
    includedIn: "Sports Pro",
    bestFor: ["Clubs", "Season awards", "Youth teams"],
    items: [
      { label: "Player of the Match Certificate", kind: "certificate" },
      { label: "Most Improved Player Certificate", kind: "certificate" },
      { label: "Fair Play Award Certificate", kind: "certificate" },
      { label: "Top Goal Scorer Certificate", kind: "certificate" },
      { label: "Participation Certificate", kind: "certificate" },
      { label: "Medal Badge Sheet", kind: "badge" },
      { label: "Club Social Graphic", kind: "social" },
      { label: "Presentation Night Banner", kind: "banner" },
    ],
  },
  {
    key: "luxury-ceremony",
    name: "Luxury Ceremony Certificate Pack",
    sectors: ["school", "church", "company", "charity", "event"],
    blurb: "Premium jewel-tone and ivory certificates for formal ceremonies and high-value recognition.",
    count: 24,
    price: "£29",
    includedIn: "All Premium Plans",
    bestFor: ["Formal events", "Leadership awards", "Annual ceremonies"],
    items: [
      { label: "Imperial Certificate", kind: "certificate" },
      { label: "Sapphire Gala Certificate", kind: "certificate" },
      { label: "Prestige Ivory Certificate", kind: "certificate" },
      { label: "Rose Ceremony Certificate", kind: "certificate" },
      { label: "Heritage Vellum Certificate", kind: "certificate" },
      { label: "Premium Seal Badge", kind: "badge" },
      { label: "Ceremony Programme Cover", kind: "card" },
    ],
  },
  {
    key: "done-for-you-setup",
    name: "Done-for-You Brand Setup",
    sectors: ["school", "church", "sports", "company", "charity", "event"],
    blurb: "We configure your logo, colours, templates, signatories and starter award packs for your organisation.",
    count: 1,
    price: "£99",
    includedIn: "One-time service",
    bestFor: ["New organisations", "Busy admins", "Launch setup"],
    items: [
      { label: "Brand Kit Configuration", kind: "certificate" },
      { label: "Logo and Colour Matching", kind: "certificate" },
      { label: "Default Template Selection", kind: "certificate" },
      { label: "Starter Award Pack Setup", kind: "certificate" },
      { label: "Signatory Setup", kind: "email" },
      { label: "PDF Export Check", kind: "card" },
    ],
  },
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
