// HonorHub domain model — the "one codebase, six verticals" engine.
// Switching vertical changes terminology, default award/reason/signatory,
// award categories and AI tone — the underlying software stays the same.

export type VerticalKey = "school" | "church" | "sports" | "company" | "charity" | "event"

export interface Vertical {
  key: VerticalKey
  brand: string // "HonorHub Schools"
  label: string // "Schools"
  org: string
  group: string
  signatory: string
  award: string
  reason: string
  categories: string[]
  tone: string
}

export const VERTICALS: Record<VerticalKey, Vertical> = {
  school: {
    key: "school",
    brand: "HonorHub Schools",
    label: "Schools",
    org: "Oakfield Primary School",
    group: "Oakfield Learning Trust",
    signatory: "Mrs Hart · Class 3",
    award: "Star of the Week",
    reason: "for brilliant effort and kindness this week",
    categories: ["Weekly Awards", "Reading", "Attendance", "Behaviour", "Sports Day", "Graduation", "Teacher Awards"],
    tone: "warm, age-appropriate and suitable for a UK school assembly",
  },
  church: {
    key: "church",
    brand: "HonorHub Churches",
    label: "Churches",
    org: "Grace Community Church",
    group: "Grace Network",
    signatory: "Pastor Ade",
    award: "Volunteer Appreciation",
    reason: "for faithful and dedicated service to the ministry",
    categories: ["Membership", "Baptism", "Workers Training", "Volunteer", "Conference", "Bible School", "Appreciation"],
    tone: "gracious, respectful and suitable for a church or ministry setting",
  },
  sports: {
    key: "sports",
    brand: "HonorHub Sports",
    label: "Sports",
    org: "Oakfield Juniors FC",
    group: "Oakfield Sports",
    signatory: "Coach Williams",
    award: "Player of the Match",
    reason: "for outstanding teamwork and determination on the pitch",
    categories: ["Player of Match", "Golden Boot", "Most Improved", "Respect Award", "Season Awards", "Tournament Winners", "Academy Graduation"],
    tone: "energetic, team-focused and suitable for a club presentation",
  },
  company: {
    key: "company",
    brand: "HonorHub Corporate",
    label: "Corporate",
    org: "Zequence Digital",
    group: "Zequence Group",
    signatory: "Managing Director",
    award: "Employee of the Month",
    reason: "for excellent contribution, professionalism and initiative",
    categories: ["Employee of Month", "Training", "Long Service", "Innovation", "Safety", "Leadership", "Recognition"],
    tone: "polished, professional and suitable for a workplace recognition programme",
  },
  charity: {
    key: "charity",
    brand: "HonorHub Charity",
    label: "Charity",
    org: "Hope Outreach",
    group: "Hope Foundation",
    signatory: "Programme Lead",
    award: "Volunteer Recognition",
    reason: "for generous service and commitment to the community",
    categories: ["Volunteer", "Community Impact", "Fundraising", "Service Award", "Training", "Appreciation"],
    tone: "sincere, community-minded and suitable for a charity",
  },
  event: {
    key: "event",
    brand: "HonorHub Events",
    label: "Events",
    org: "HonorHub Conference",
    group: "Zequence Events",
    signatory: "Event Director",
    award: "Event Appreciation",
    reason: "for valuable contribution to the success of the event",
    categories: ["Speaker", "Volunteer", "Sponsor", "Committee", "Attendee", "Conference Award"],
    tone: "polished, celebratory and suitable for an event ceremony",
  },
}

export const VERTICAL_LIST = Object.values(VERTICALS)

export interface TemplateDef {
  key: string
  name: string
  blurb: string
}

export const TEMPLATES: TemplateDef[] = [
  // Signature tier — designed, illustrative certificates
  { key: "excellence", name: "Classic Excellence", blurb: "Timeless & elegant" },
  { key: "playful", name: "Bright & Playful", blurb: "Fun for young learners" },
  { key: "grace", name: "Church Appreciation", blurb: "Warm & graceful" },
  { key: "champion", name: "Sports Excellence", blurb: "Energetic & bold" },
  { key: "executive", name: "Modern Professional", blurb: "Sleek & corporate" },
  // Luxury tier — jewel-tone papers, gold-foil text and ornate flourishes
  { key: "imperial", name: "Imperial", blurb: "Navy & gold, regal" },
  { key: "opulent", name: "Opulent", blurb: "Ivory & gold, ornate" },
  { key: "onyx", name: "Onyx", blurb: "Black-tie minimal" },
  { key: "emerald", name: "Emerald", blurb: "Jewel green & gold" },
  { key: "burgundy", name: "Burgundy", blurb: "Deep wine & gold" },
  { key: "prestige", name: "Prestige Ivory", blurb: "Ivory, ink & gold" },
  { key: "sapphire", name: "Sapphire Gala", blurb: "Royal blue ceremony" },
  { key: "vellum", name: "Heritage Vellum", blurb: "Engraved parchment" },
  { key: "rose", name: "Rose Ceremony", blurb: "Soft rose-gold" },
  // Classic tier
  { key: "laurel", name: "Laurel", blurb: "Classic, ceremonial" },
  { key: "sunbeam", name: "Sunbeam", blurb: "Warm, younger years" },
  { key: "meadow", name: "Meadow", blurb: "Fresh, modern" },
  { key: "regal", name: "Regal", blurb: "Formal, premium" },
  { key: "confetti", name: "Confetti", blurb: "Playful, celebration" },
  { key: "botanical", name: "Botanical", blurb: "Elegant line art" },
  { key: "midnight", name: "Midnight", blurb: "Premium dark" },
]

export interface Accent {
  name: string
  hex: string
}

export const ACCENTS: Accent[] = [
  { name: "Honor Orange", hex: "#F58220" },
  { name: "Gold", hex: "#B8893A" },
  { name: "Champagne", hex: "#C8A96A" },
  { name: "Rose Gold", hex: "#C08552" },
  { name: "Coral", hex: "#CF6A4C" },
  { name: "Emerald", hex: "#2E7D5B" },
  { name: "Sage", hex: "#5E8C6A" },
  { name: "Sky", hex: "#4F86B0" },
  { name: "Royal", hex: "#3B5BA5" },
  { name: "Plum", hex: "#8A5A86" },
  { name: "Burgundy", hex: "#8C2F39" },
  { name: "Coffee", hex: "#6A4A3C" },
  { name: "Ink", hex: "#46443F" },
]

export interface Recipient {
  name: string
  reason: string
}

export function parseRecipients(raw: string, defaultReason: string): Recipient[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.split(/\s+[—–-]\s+/)
      return { name: m[0].trim(), reason: (m[1] || defaultReason).trim() }
    })
}

export function todayUK(): string {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}
