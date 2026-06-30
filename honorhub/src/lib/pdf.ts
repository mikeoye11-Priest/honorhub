// True client-side certificate rendering. Each certificate is laid out
// off-screen at a fixed pixel size (so the cqw-based design resolves), snapshotted
// with the browser's own renderer (gradients, foil text and container queries all
// work), and either written into an A4-landscape PDF (one page per certificate)
// or exported as a single PNG for sharing.
import { certInnerHTML, type CertPage } from "@/components/Certificate"

const PX_W = 1123 // ≈ A4 landscape width at 96dpi
const PX_H = Math.round((PX_W * 210) / 297)
const RENDER_OPTS = { pixelRatio: 2, backgroundColor: "#ffffff", width: PX_W, height: PX_H, cacheBust: true }

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
  // Use a SOLID paper colour — baking the decorative var()/color-mix gradients
  // makes html-to-image render them as a strong accent wash over the paper.
  el.style.background = paper

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
