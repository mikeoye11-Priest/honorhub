import type { CSSProperties } from "react"
import { ORN, seal } from "@/lib/ornaments"
import type { Recipient } from "@/lib/honor"
import "./certificate.css"

function esc(s: string) {
  return (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string)
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
  return `
    <div class="frame"></div><div class="frame inner"></div>
    ${ORN[f.template] || ""}
    <div class="body">
      ${f.logo ? `<img class="logo" src="${f.logo}" alt="">` : ""}
      <div class="eyebrow">${esc(f.org)}</div>
      <h2 class="award">${esc(f.award)}</h2>
      <div class="preposition">is proudly awarded to</div>
      <div class="name">${esc(recipient ? recipient.name : "Recipient name")}</div>
      <div class="rule"></div>
      <div class="reason">${esc(recipient ? recipient.reason : "")}</div>
    </div>
    <div class="foot">
      <div class="sig"><div class="v">${esc(f.signatory)}</div><div class="k">Signed</div></div>
      <div class="date"><div class="v">${esc(f.date)}</div><div class="k">Date</div></div>
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
 *  Pack mode passes one page per certificate-item × recipient. */
export function printPages(pages: CertPage[]) {
  if (!pages.length) return
  const existing = document.querySelector(".print-area")
  if (existing) existing.remove()
  const area = document.createElement("div")
  area.className = "print-area"
  area.innerHTML = pages
    .map(
      (p) =>
        `<div class="print-page"><div class="cert t-${p.fields.template}" style="--accent:${p.fields.accent}">${certInnerHTML(p.fields, p.recipient)}</div></div>`
    )
    .join("")
  document.body.appendChild(area)
  window.print()
}

/** Opens the browser print dialog with one A4 landscape page per recipient. */
export function printCertificates(fields: CertFields, recipients: Recipient[]) {
  printPages(recipients.map((r) => ({ fields, recipient: r })))
}
