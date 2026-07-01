import type { CSSProperties } from "react"
import { ORN, seal } from "@/lib/ornaments"
import type { Recipient } from "@/lib/honor"
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

export interface CertFields {
  template: string
  accent: string
  logo: string | null
  org: string
  award: string
  date: string
  signatory: string
}

/** Returns the inner HTML string for a single certificate (used for both
 *  the live React preview and the print document). */
export function certInnerHTML(f: CertFields, recipient?: Recipient): string {
  const name = recipient ? recipient.name : "Recipient name"
  const reason = recipient ? recipient.reason : ""
  const orgClass = fitClass("eyebrow", f.org, [30, 46, 62])
  const awardClass = fitClass("award", f.award, [22, 34, 48])
  const nameClass = fitClass("name", name, [18, 27, 36])
  const reasonClass = fitClass("reason", reason, [70, 110, 150])
  const sigClass = fitClass("sig", f.signatory, [22, 32, 42])
  const dateClass = fitClass("date", f.date, [24, 34, 44])

  return `
    <div class="frame"></div><div class="frame inner"></div>
    ${ORN[f.template] || ""}
    <div class="body">
      ${f.logo ? `<img class="logo" src="${f.logo}" alt="">` : ""}
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
  return (
    <div
      className={`cert t-${fields.template}`}
      style={{ "--accent": fields.accent } as CSSProperties}
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

  const body = pages
    .map(
      (p) =>
        `<div class="print-page"><div class="cert t-${p.fields.template}" style="--accent:${p.fields.accent}">${certInnerHTML(p.fields, p.recipient)}</div></div>`,
    )
    .join("")

  const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${document.baseURI}">${styles}<style>
    @page { size: A4 landscape; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .print-page {
      width: 297mm; height: 210mm;
      display: flex; align-items: center; justify-content: center;
      background: #fff; page-break-after: always; break-after: page;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .print-page:last-child { page-break-after: auto; break-after: auto; }
    .print-page .cert { width: 273mm; }
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
