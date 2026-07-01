// True client-side certificate rendering. Each certificate is laid out
// off-screen at a fixed pixel size (so the cqw-based design resolves), snapshotted
// with the browser's own renderer (gradients, foil text and container queries all
// work), and either written into an A4-landscape PDF (one page per certificate)
// or exported as a single PNG for sharing.
import { certClassName, certInnerHTML, printPages, type CertPage } from "@/components/Certificate"

const PX_W = 1123 // ≈ A4 landscape width at 96dpi
const PX_H = Math.round((PX_W * 210) / 297)
const RENDER_OPTS = { pixelRatio: 2, width: PX_W, height: PX_H, cacheBust: true }
const CANVAS_SCALE = 2

export function usesNativePdfDialog(): boolean {
  const ua = navigator.userAgent
  return /\bChrome\//.test(ua) && !/\bEdg\//.test(ua) && !/\bOPR\//.test(ua)
}

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

type PaintVar = (typeof PAINT_VARS)[number]

const TEMPLATE_PAINT: Record<string, Partial<Record<PaintVar, string>>> = {
  laurel: { "--paper": "#fcf9f2", "--cert-display": "var(--serif)" },
  sunbeam: { "--paper": "#fff7ee", "--cert-display": "var(--round)" },
  meadow: { "--paper": "#f5faf5", "--cert-display": "var(--serif)" },
  regal: { "--paper": "#fbf8f0", "--cert-display": "var(--serif)" },
  confetti: { "--paper": "#ffffff", "--cert-display": "var(--round)" },
  botanical: { "--paper": "#f6faf2", "--cert-display": "var(--serif)" },
  midnight: {
    "--paper": "#1b2230",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#ece7da",
    "--cert-ink-soft": "#aea89a",
    "--cert-ink-faint": "#6b6657",
  },
  excellence: { "--paper": "#fcf8ef", "--navy": "#1c2742", "--cert-display": "var(--serif)" },
  playful: { "--paper": "#ffffff", "--cert-display": "var(--round)" },
  grace: { "--paper": "#f6f3e7", "--leaf": "#6f7f4e", "--cert-display": "var(--serif)" },
  champion: {
    "--paper": "#16213e",
    "--navy": "#16213e",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#f1ebdb",
    "--cert-ink-soft": "#c2b594",
    "--cert-ink-faint": "#7d7457",
  },
  executive: { "--paper": "#ffffff", "--navy": "#1b2540", "--cert-display": "var(--serif)" },
  imperial: {
    "--paper": "#101a33",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#f1ebdb",
    "--cert-ink-soft": "#c2b594",
    "--cert-ink-faint": "#837a5c",
  },
  emerald: {
    "--paper": "#0e2b22",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#f1ebdb",
    "--cert-ink-soft": "#c2b594",
    "--cert-ink-faint": "#837a5c",
  },
  burgundy: {
    "--paper": "#2a0e16",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#f1ebdb",
    "--cert-ink-soft": "#c2b594",
    "--cert-ink-faint": "#837a5c",
  },
  onyx: {
    "--paper": "#141418",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#f1ebdb",
    "--cert-ink-soft": "#c2b594",
    "--cert-ink-faint": "#837a5c",
  },
  opulent: { "--paper": "#fbf6ea", "--cert-display": "var(--serif)" },
  prestige: {
    "--paper": "#fffdf7",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#20242e",
    "--cert-ink-soft": "#746b5d",
    "--cert-ink-faint": "#a99872",
  },
  sapphire: {
    "--paper": "#0c2446",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#f2eddf",
    "--cert-ink-soft": "#c7b98e",
    "--cert-ink-faint": "#807454",
  },
  vellum: {
    "--paper": "#fff8e8",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#2f2a25",
    "--cert-ink-soft": "#7b6c57",
    "--cert-ink-faint": "#b59c6d",
  },
  rose: {
    "--paper": "#fff7f8",
    "--cert-display": "var(--serif)",
    "--cert-ink": "#402832",
    "--cert-ink-soft": "#7c6270",
    "--cert-ink-faint": "#b98b95",
  },
}

const CLIPPED_TEXT_SELECTORS: Record<string, string[]> = {
  champion: [".award", ".name"],
  playful: [".award"],
  imperial: [".award", ".name"],
  opulent: [".award", ".name"],
  onyx: [".name"],
  emerald: [".name"],
  burgundy: [".name"],
  sapphire: [".award", ".name"],
}

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

function applySolidTextForPdf(el: HTMLElement, template: string, accent: string) {
  for (const selector of CLIPPED_TEXT_SELECTORS[template] ?? []) {
    for (const node of el.querySelectorAll<HTMLElement>(selector)) {
      node.style.setProperty("background", "none", "important")
      node.style.setProperty("background-image", "none", "important")
      node.style.setProperty("-webkit-background-clip", "initial", "important")
      node.style.setProperty("background-clip", "border-box", "important")
      node.style.setProperty("-webkit-text-fill-color", accent, "important")
      node.style.setProperty("color", accent, "important")
    }
  }
}

interface MountedCert {
  el: HTMLDivElement
  paper: string
}

/** Create the off-screen certificate, append it, and bake the template's
 *  resolved variables + background inline so the snapshot matches the on-screen
 *  design. Also substitutes literal colours into the inline SVG (html-to-image
 *  renders currentColor/var() in SVG unreliably, often as black). */
function mountCertEl(host: HTMLDivElement, page: CertPage): MountedCert {
  const el = document.createElement("div")
  el.className = certClassName(page.fields, "pdf-export")
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
  Object.assign(vars, TEMPLATE_PAINT[page.fields.template] ?? {})
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
  el.innerHTML = `<div aria-hidden="true" style="position:absolute;inset:0;background:${paper};z-index:0"></div>${html}`
  applySolidTextForPdf(el, page.fields.template, accent)
  return { el, paper }
}

function opaqueImageData(canvas: HTMLCanvasElement, paper: string): string {
  const flattened = document.createElement("canvas")
  flattened.width = canvas.width
  flattened.height = canvas.height
  const ctx = flattened.getContext("2d")
  if (!ctx) return canvas.toDataURL("image/png")
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, flattened.width, flattened.height)
  ctx.drawImage(canvas, 0, 0)
  return flattened.toDataURL("image/jpeg", 0.96)
}

async function capturePdfCanvas(el: HTMLDivElement, paper: string): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas")
  return html2canvas(el, {
    backgroundColor: paper,
    scale: CANVAS_SCALE,
    width: PX_W,
    height: PX_H,
    useCORS: true,
    logging: false,
  })
}

export async function downloadPdf(pages: CertPage[], filename = "honorhub-certificates.pdf"): Promise<void> {
  if (!pages.length) return
  if (usesNativePdfDialog()) {
    printPages(pages)
    return
  }
  const { jsPDF } = await import("jspdf")
  await ensureFonts()

  const host = makeHost()
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  try {
    for (let i = 0; i < pages.length; i++) {
      const { el, paper } = mountCertEl(host, pages[i])
      const canvas = await capturePdfCanvas(el, paper)
      if (i > 0) pdf.addPage()
      pdf.addImage(opaqueImageData(canvas, paper), "JPEG", 0, 0, 297, 210)
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
      const { el } = mountCertEl(host, pages[0])
      const blob = await toBlob(el, RENDER_OPTS)
      if (!blob) throw new Error("image render failed")
      return new File([blob], `${fileBase}.png`, { type: "image/png" })
    } finally {
      host.remove()
    }
  }

  // Several certificates → reuse the PDF path, but capture the bytes.
  const { jsPDF } = await import("jspdf")
  const host = makeHost()
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  try {
    for (let i = 0; i < pages.length; i++) {
      const { el, paper } = mountCertEl(host, pages[i])
      const canvas = await capturePdfCanvas(el, paper)
      if (i > 0) pdf.addPage()
      pdf.addImage(opaqueImageData(canvas, paper), "JPEG", 0, 0, 297, 210)
      host.removeChild(el)
    }
  } finally {
    host.remove()
  }
  return new File([pdf.output("blob")], `${fileBase}.pdf`, { type: "application/pdf" })
}
