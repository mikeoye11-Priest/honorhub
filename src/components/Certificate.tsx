import type { CSSProperties } from "react"
import { ORN, seal } from "@/lib/ornaments"
import type { Recipient } from "@/lib/honor"
import type { CustomField, CustomLayout } from "@/lib/custom-templates"
import "./certificate.css"

function esc(s: string) {
  return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string)
}

function compactLen(s: string): number {
  return (s || "").replace(/\s+/g, " ").trim().length
}

function fitClass(base: string, text: string, limits: [number, number, number]): string {
  const len = compactLen(text)
  if (len >= limits[2]) return `${base} ${base}--xl`
  if (len >= limits[1]) return `${base} ${base}--lg`
  if (len >= limits[0]) return `${base} ${base}--md`
  return base
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export interface CertFields {
  template: string
  accent: string
  logo: string | null
  logoScale?: number
  logoX?: number
  logoY?: number
  org: string
  award: string
  date: string
  signatory: string
  // Present only for uploaded "bring-your-own" templates (template === "custom").
  custom?: CustomLayout
}

export function certClassName(fields: Pick<CertFields, "template" | "logo">, extra = ""): string {
  return ["cert", `t-${fields.template}`, fields.logo ? "has-logo" : "", extra].filter(Boolean).join(" ")
}

const FIELD_FONT: Record<CustomField["font"], string> = {
  serif: "var(--serif)",
  sans: "var(--ui)",
  script: "var(--script)",
}

function customFieldValue(key: CustomField["key"], f: CertFields, recipient?: Recipient): string {
  switch (key) {
    case "name":
      return recipient ? recipient.name : "Recipient name"
    case "reason":
      return recipient ? recipient.reason : ""
    case "award":
      return f.award
    case "date":
      return f.date
    case "signatory":
      return f.signatory
    case "org":
      return f.org
  }
}

/** Render an uploaded template: the background image + absolutely-positioned
 *  text fields. Positions/sizes are fractions of the certificate, so they scale
 *  identically in the small preview and on a full A4 export. */
function customCertInnerHTML(f: CertFields, recipient?: Recipient): string {
  const layout = f.custom
  if (!layout) return ""
  const fields = layout.fields
    .map((fld) => {
      const raw = customFieldValue(fld.key, f, recipient)
      if (!raw) return ""
      const text = fld.uppercase ? raw.toUpperCase() : raw
      const style = [
        `left:${(fld.x * 100).toFixed(3)}%`,
        `top:${(fld.y * 100).toFixed(3)}%`,
        `width:${(fld.width * 100).toFixed(3)}%`,
        `font-size:${(fld.fontSize * 100).toFixed(3)}cqw`,
        `color:${fld.color}`,
        `text-align:${fld.align}`,
        `font-weight:${fld.weight}`,
        `font-family:${FIELD_FONT[fld.font] || "var(--serif)"}`,
      ].join(";")
      return `<div class="cf" style="${style}">${esc(text)}</div>`
    })
    .join("")
  return `<img class="cert-bg" src="${esc(layout.background)}" alt="">${fields}`
}

/** Returns the inner HTML string for a single certificate (used for both
 *  the live React preview and the print document). */
export function certInnerHTML(f: CertFields, recipient?: Recipient): string {
  if (f.custom) return customCertInnerHTML(f, recipient)
  const name = recipient ? recipient.name : "Recipient name"
  const reason = recipient ? recipient.reason : ""
  const orgClass = fitClass("eyebrow", f.org, [30, 46, 62])
  const awardClass = fitClass("award", f.award, [22, 34, 48])
  const nameClass = fitClass("name", name, [18, 27, 36])
  const reasonClass = fitClass("reason", reason, [70, 110, 150])
  const sigClass = fitClass("sig", f.signatory, [22, 32, 42])
  const dateClass = fitClass("date", f.date, [24, 34, 44])
  const logoScale = clampNumber(f.logoScale, 60, 180, 100)
  const logoX = clampNumber(f.logoX, -24, 24, 0)
  const logoY = clampNumber(f.logoY, -12, 18, 0)
  const logoStyle = `--logo-scale:${logoScale};--logo-x:${logoX}cqw;--logo-y:${logoY}cqw;`

  return `
    <div class="frame"></div><div class="frame inner"></div>
    ${ORN[f.template] || ""}
    <div class="body">
      ${f.logo ? `<img class="logo" src="${esc(f.logo)}" alt="" style="${logoStyle}">` : ""}
      <div class="${orgClass}">${esc(f.org)}</div>
      <h2 class="${awardClass}">${esc(f.award)}</h2>
      <div class="preposition">is proudly awarded to</div>
      <div class="${nameClass}">${esc(name)}</div>
      <div class="rule"></div>
      <div class="${reasonClass}">${esc(reason)}</div>
    </div>
    <div class="foot">
      <div class="${sigClass}"><div class="v">${esc(f.signatory)}</div><div class="k">Signed</div></div>
      <div class="${dateClass}"><div class="v">${esc(f.date)}</div><div class="k">Date</div></div>
    </div>
    ${seal()}`
}

export function Certificate({ fields, recipient }: { fields: CertFields; recipient?: Recipient }) {
  const style = { "--accent": fields.accent } as CSSProperties
  // Uploaded templates adopt their own aspect ratio so the image isn't distorted
  // and the positioned fields line up with the artwork.
  if (fields.custom) style.aspectRatio = String(fields.custom.aspect)
  return (
    <div
      className={certClassName(fields)}
      style={style}
      // certInnerHTML is built from app-controlled template strings + escaped user text
      dangerouslySetInnerHTML={{ __html: certInnerHTML(fields, recipient) }}
    />
  )
}

export interface CertPage {
  fields: CertFields
  recipient?: Recipient
}

/** Opens the print dialog with one A4 landscape page per (fields, recipient) pair.
 *  Pack mode passes one page per certificate-item × recipient.
 *
 *  Renders into an isolated <iframe> rather than overlaying the live app: the
 *  shadcn sidebar shell (fixed/sticky elements, container queries) made the old
 *  `body * { visibility:hidden }` print hack produce blank pages. The iframe
 *  carries only the certificates plus the app's own stylesheets, so what prints
 *  matches the on-screen design exactly. */
export function printPages(pages: CertPage[]) {
  if (!pages.length) return

  // Carry over every app stylesheet so fonts, gradients and template styles
  // resolve identically inside the print iframe.
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((n) => n.outerHTML)
    .join("\n")

  // All pages in one job share a template, so orient/size the A4 page from its
  // aspect: built-ins are landscape; an uploaded template keeps its own ratio.
  const aspect = pages[0].fields.custom?.aspect ?? 297 / 210
  const landscape = aspect >= 1
  const pageW = landscape ? 297 : 210
  const pageH = landscape ? 210 : 297
  const certW = Math.min(pageW - 24, (pageH - 24) * aspect)

  const body = pages
    .map((p) => {
      const style = `--accent:${p.fields.accent}${p.fields.custom ? `;aspect-ratio:${p.fields.custom.aspect}` : ""}`
      return `<div class="print-page"><div class="${certClassName(p.fields)}" style="${style}">${certInnerHTML(p.fields, p.recipient)}</div></div>`
    })
    .join("")

  const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${document.baseURI}">${styles}<style>
    @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .print-page {
      width: ${pageW}mm; height: ${pageH}mm;
      display: flex; align-items: center; justify-content: center;
      background: #fff; page-break-after: always; break-after: page;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .print-page:last-child { page-break-after: auto; break-after: auto; }
    .print-page .cert { width: ${certW.toFixed(1)}mm; }
  </style></head><body>${body}</body></html>`

  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;"

  iframe.onload = () => {
    const win = iframe.contentWindow
    if (!win) return
    const run = () => {
      win.focus()
      win.print()
      // Leave the iframe long enough for the (modal) print dialog to read it.
      setTimeout(() => iframe.remove(), 1000)
    }
    // Wait for web fonts so glyphs aren't missing on the first paint.
    const fonts = iframe.contentDocument?.fonts
    if (fonts?.ready) fonts.ready.then(run).catch(run)
    else run()
  }

  document.body.appendChild(iframe)
  iframe.srcdoc = html
}

/** Opens the browser print dialog with one A4 landscape page per recipient. */
export function printCertificates(fields: CertFields, recipients: Recipient[]) {
  printPages(recipients.map((r) => ({ fields, recipient: r })))
}
