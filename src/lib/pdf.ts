// True client-side certificate rendering. Each certificate is laid out
// off-screen at a fixed pixel size (so the cqw-based design resolves), snapshotted
// with the browser's own renderer (gradients, foil text and container queries all
// work), and either written into an A4-landscape PDF (one page per certificate)
// or exported as a single PNG for sharing.
import { certInnerHTML, type CertPage } from "@/components/Certificate"

const PX_W = 1123 // ≈ A4 landscape width at 96dpi
const PX_H = Math.round((PX_W * 210) / 297)
const RENDER_OPTS = { pixelRatio: 2, width: PX_W, height: PX_H, cacheBust: true }

async function ensureFonts(): Promise<void> {
  // Make sure web fonts (Fraunces, Great Vibes, …) are ready before snapshotting.
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }
}

/** An off-screen, full-width host the certificate is rendered into. */
function makeHost(): HTMLDivElement {
  const host = document.createElement("div")
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PX_W}px;pointer-events:none;opacity:1;`
  document.body.appendChild(host)
  return host
}

// Every CSS custom property a template can rely on. html-to-image@1.11 snapshots
// the element but loses class-defined custom properties (it keeps inline ones),
// so var(--paper)/var(--cert-ink)/… silently fall back to their defaults — e.g.
// a dark template (Midnight) loses its dark paper and renders white. We bake the
// resolved values inline so the snapshot no longer depends on the .t-<key> rules.
const PAINT_VARS = [
  "--paper",
  "--accent",
  "--foil-1",
  "--foil-2",
  "--foil-3",
  "--foil-4",
  "--foil-5",
  "--accent-wash",
  "--accent-border-dark",
  "--accent-border-light",
  "--accent-border-soft",
  "--navy-border-soft",
  "--cert-ink",
  "--cert-ink-soft",
  "--cert-ink-faint",
  "--navy",
  "--leaf",
  "--cert-display",
  "--serif",
  "--round",
  "--ui",
  "--script",
] as const

function parseHex(hex: string): [number, number, number] | null {
  const value = hex.trim().replace(/^#/, "")
  if (/^[\da-f]{3}$/i.test(value)) {
    return value.split("").map((c) => parseInt(c + c, 16)) as [number, number, number]
  }
  if (/^[\da-f]{6}$/i.test(value)) {
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
  }
  return null
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0")).join("")}`
}

function mix(from: string, amount: number, to: string): string {
  const a = parseHex(from)
  const b = parseHex(to)
  if (!a || !b) return from
  return toHex([a[0] * amount + b[0] * (1 - amount), a[1] * amount + b[1] * (1 - amount), a[2] * amount + b[2] * (1 - amount)])
}

function alpha(from: string, opacity: number): string {
  const rgb = parseHex(from)
  if (!rgb) return from
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`
}

function bakeAccentMixes(el: HTMLElement, accent: string, navy: string) {
  el.style.setProperty("--foil-1", mix(accent, 0.4, "#ffffff"))
  el.style.setProperty("--foil-2", mix(accent, 0.8, "#ffffff"))
  el.style.setProperty("--foil-3", accent)
  el.style.setProperty("--foil-4", mix(accent, 0.62, "#000000"))
  el.style.setProperty("--foil-5", mix(accent, 0.32, "#ffffff"))
  el.style.setProperty("--accent-wash", alpha(accent, 0.09))
  el.style.setProperty("--accent-border-light", mix(accent, 0.45, "#ffffff"))
  el.style.setProperty("--accent-border-dark", mix(accent, 0.58, "#000000"))
  el.style.setProperty("--accent-border-soft", alpha(accent, 0.65))
  if (navy) el.style.setProperty("--navy-border-soft", alpha(navy, 0.22))
}

/** Create the off-screen certificate, append it, and bake the template's
 *  resolved variables + background inline so the snapshot matches the on-screen
 *  design. Also substitutes literal colours into the inline SVG (html-to-image
 *  renders currentColor/var() in SVG unreliably, often as black). */
function mountCertEl(host: HTMLDivElement, page: CertPage): HTMLDivElement {
  const el = document.createElement("div")
  el.className = `cert t-${page.fields.template}`
  el.style.cssText = `width:${PX_W}px;height:${PX_H}px;animation:none;`
  el.style.setProperty("--accent", page.fields.accent)
  host.appendChild(el)

  // Snapshot computed values up front — getComputedStyle is live, so read every
  // value before mutating el.style below.
  const cs = getComputedStyle(el)
  const vars: Record<string, string> = {}
  for (const v of PAINT_VARS) {
    const val = cs.getPropertyValue(v).trim()
    if (val) vars[v] = val
  }
  const paper = vars["--paper"] || cs.backgroundColor || "#ffffff"
  const accent = vars["--accent"] || page.fields.accent
  const navy = vars["--navy"] || ""
  const leaf = vars["--leaf"] || ""

  // Bake the variables inline so the snapshot doesn't depend on the .t-<key>
  // class rules (html-to-image drops class-defined custom properties).
  for (const [v, val] of Object.entries(vars)) el.style.setProperty(v, val)
  bakeAccentMixes(el, accent, navy)
  // Force the whole background shorthand to the resolved paper colour so the
  // snapshot keeps dark and colour-washed templates instead of depending on
  // html-to-image's class/style cloning quirks.
  el.style.setProperty("background", paper, "important")

  // Resolve SVG ornament colours to literal hex (currentColor/var in SVG render
  // unreliably under html-to-image).
  let html = certInnerHTML(page.fields, page.recipient)
  html = html.replace(/currentColor/g, accent)
  if (navy) html = html.replace(/var\(--navy\)/g, navy)
  if (leaf) html = html.replace(/var\(--leaf\)/g, leaf)
  html = html.replace(/var\(--accent\)/g, accent)
  el.innerHTML = html
  return el
}

export async function downloadPdf(pages: CertPage[], filename = "honorhub-certificates.pdf"): Promise<void> {
  if (!pages.length) return
  const [{ jsPDF }, { toCanvas }] = await Promise.all([import("jspdf"), import("html-to-image")])
  await ensureFonts()

  const host = makeHost()
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  try {
    for (let i = 0; i < pages.length; i++) {
      const el = mountCertEl(host, pages[i])
      const canvas = await toCanvas(el, RENDER_OPTS)
      if (i > 0) pdf.addPage()
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210)
      host.removeChild(el)
    }
    pdf.save(filename)
  } finally {
    host.remove()
  }
}

/** Build a shareable File for the Web Share flow: a crisp PNG for a single
 *  certificate, or a multi-page PDF when there are several. */
export async function buildShareFile(pages: CertPage[], fileBase = "honorhub-certificate"): Promise<File> {
  if (!pages.length) throw new Error("no certificates to share")
  await ensureFonts()

  // Single certificate → a PNG, which previews nicely in chat/social share sheets.
  if (pages.length === 1) {
    const { toBlob } = await import("html-to-image")
    const host = makeHost()
    try {
      const el = mountCertEl(host, pages[0])
      const blob = await toBlob(el, RENDER_OPTS)
      if (!blob) throw new Error("image render failed")
      return new File([blob], `${fileBase}.png`, { type: "image/png" })
    } finally {
      host.remove()
    }
  }

  // Several certificates → reuse the PDF path, but capture the bytes.
  const [{ jsPDF }, { toCanvas }] = await Promise.all([import("jspdf"), import("html-to-image")])
  const host = makeHost()
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  try {
    for (let i = 0; i < pages.length; i++) {
      const el = mountCertEl(host, pages[i])
      const canvas = await toCanvas(el, RENDER_OPTS)
      if (i > 0) pdf.addPage()
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210)
      host.removeChild(el)
    }
  } finally {
    host.remove()
  }
  return new File([pdf.output("blob")], `${fileBase}.pdf`, { type: "application/pdf" })
}
