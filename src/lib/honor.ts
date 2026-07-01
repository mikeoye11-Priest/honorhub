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
  tier: "signature" | "luxury" | "classic"
  style: "formal" | "playful" | "modern" | "spiritual" | "sport" | "botanical"
  bestFor: VerticalKey[]
  defaultAccent: string
  tags: string[]
}

export const TEMPLATES: TemplateDef[] = [
  // Signature tier — designed, illustrative certificates
  { key: "excellence", name: "Classic Excellence", blurb: "Timeless & elegant", tier: "signature", style: "formal", bestFor: ["school", "event", "charity"], defaultAccent: "#B8893A", tags: ["classic", "cream", "gold", "ceremony"] },
  { key: "playful", name: "Bright & Playful", blurb: "Fun for young learners", tier: "signature", style: "playful", bestFor: ["school", "event"], defaultAccent: "#7C3AED", tags: ["kids", "colourful", "primary", "celebration"] },
  { key: "grace", name: "Church Appreciation", blurb: "Warm & graceful", tier: "signature", style: "spiritual", bestFor: ["church", "charity"], defaultAccent: "#8A5A2B", tags: ["church", "ministry", "warm", "grace"] },
  { key: "champion", name: "Sports Excellence", blurb: "Energetic & bold", tier: "signature", style: "sport", bestFor: ["sports", "school", "event"], defaultAccent: "#F58220", tags: ["sports", "bold", "team", "dark"] },
  { key: "executive", name: "Modern Professional", blurb: "Sleek & corporate", tier: "signature", style: "modern", bestFor: ["company", "charity", "event"], defaultAccent: "#B8893A", tags: ["business", "corporate", "minimal", "navy"] },
  // Luxury tier — jewel-tone papers, gold-foil text and ornate flourishes
  { key: "imperial", name: "Imperial", blurb: "Navy & gold, regal", tier: "luxury", style: "formal", bestFor: ["school", "church", "event", "company"], defaultAccent: "#C8A96A", tags: ["navy", "gold", "regal", "premium"] },
  { key: "opulent", name: "Opulent", blurb: "Ivory & gold, ornate", tier: "luxury", style: "formal", bestFor: ["church", "event", "charity"], defaultAccent: "#B8893A", tags: ["ivory", "gold", "ornate", "premium"] },
  { key: "onyx", name: "Onyx", blurb: "Black-tie minimal", tier: "luxury", style: "modern", bestFor: ["company", "event", "sports"], defaultAccent: "#C8A96A", tags: ["black", "minimal", "gala", "premium"] },
  { key: "emerald", name: "Emerald", blurb: "Jewel green & gold", tier: "luxury", style: "formal", bestFor: ["school", "church", "charity"], defaultAccent: "#C8A96A", tags: ["green", "jewel", "gold", "premium"] },
  { key: "burgundy", name: "Burgundy", blurb: "Deep wine & gold", tier: "luxury", style: "formal", bestFor: ["event", "church", "company"], defaultAccent: "#C8A96A", tags: ["wine", "gold", "ceremony", "premium"] },
  { key: "prestige", name: "Prestige Ivory", blurb: "Ivory, ink & gold", tier: "luxury", style: "modern", bestFor: ["company", "event", "school"], defaultAccent: "#B8893A", tags: ["ivory", "ink", "prestige", "executive"] },
  { key: "sapphire", name: "Sapphire Gala", blurb: "Royal blue ceremony", tier: "luxury", style: "formal", bestFor: ["event", "school", "company"], defaultAccent: "#C8A96A", tags: ["blue", "gala", "formal", "premium"] },
  { key: "vellum", name: "Heritage Vellum", blurb: "Engraved parchment", tier: "luxury", style: "formal", bestFor: ["church", "school", "charity"], defaultAccent: "#B8893A", tags: ["parchment", "heritage", "engraved", "traditional"] },
  { key: "rose", name: "Rose Ceremony", blurb: "Soft rose-gold", tier: "luxury", style: "botanical", bestFor: ["event", "charity", "church"], defaultAccent: "#C08552", tags: ["rose", "soft", "gold", "elegant"] },
  // Classic tier
  { key: "laurel", name: "Laurel", blurb: "Classic, ceremonial", tier: "classic", style: "formal", bestFor: ["school", "church", "charity", "event"], defaultAccent: "#F58220", tags: ["classic", "simple", "ceremony"] },
  { key: "sunbeam", name: "Sunbeam", blurb: "Warm, younger years", tier: "classic", style: "playful", bestFor: ["school"], defaultAccent: "#F58220", tags: ["warm", "young", "simple"] },
  { key: "meadow", name: "Meadow", blurb: "Fresh, modern", tier: "classic", style: "botanical", bestFor: ["school", "charity"], defaultAccent: "#5E8C6A", tags: ["fresh", "green", "modern"] },
  { key: "regal", name: "Regal", blurb: "Formal, premium", tier: "classic", style: "formal", bestFor: ["school", "event", "company"], defaultAccent: "#B8893A", tags: ["formal", "premium", "classic"] },
  { key: "confetti", name: "Confetti", blurb: "Playful, celebration", tier: "classic", style: "playful", bestFor: ["school", "event"], defaultAccent: "#F58220", tags: ["fun", "celebration", "kids"] },
  { key: "botanical", name: "Botanical", blurb: "Elegant line art", tier: "classic", style: "botanical", bestFor: ["church", "charity", "event"], defaultAccent: "#5E8C6A", tags: ["botanical", "line art", "elegant"] },
  { key: "midnight", name: "Midnight", blurb: "Premium dark", tier: "classic", style: "modern", bestFor: ["company", "sports", "event"], defaultAccent: "#C8A96A", tags: ["dark", "premium", "minimal"] },
]

export const TEMPLATE_TIERS: Array<{ key: TemplateDef["tier"]; label: string }> = [
  { key: "signature", label: "Signature" },
  { key: "luxury", label: "Luxury" },
  { key: "classic", label: "Classic" },
]

export const TEMPLATE_STYLES: Array<{ key: TemplateDef["style"]; label: string }> = [
  { key: "formal", label: "Formal" },
  { key: "playful", label: "Playful" },
  { key: "modern", label: "Modern" },
  { key: "spiritual", label: "Spiritual" },
  { key: "sport", label: "Sport" },
  { key: "botanical", label: "Botanical" },
]

export function getTemplate(key: string): TemplateDef {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0]
}

export function getRecommendedTemplates(vertical: VerticalKey): TemplateDef[] {
  return TEMPLATES.filter((t) => t.bestFor.includes(vertical)).slice(0, 8)
}

export function templateSearchText(t: TemplateDef): string {
  return `${t.name} ${t.blurb} ${t.tier} ${t.style} ${t.tags.join(" ")} ${t.bestFor.join(" ")}`.toLowerCase()
}

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
