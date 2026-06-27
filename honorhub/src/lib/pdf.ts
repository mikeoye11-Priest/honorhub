// True client-side PDF export. Each certificate is laid out off-screen at a
// fixed pixel size (so the cqw-based design resolves), snapshotted with the
// browser's own renderer (gradients, foil text and container queries all work),
// and written into an A4-landscape PDF — one page per certificate.
import { certInnerHTML, type CertPage } from "@/components/Certificate"

const PX_W = 1123 // ≈ A4 landscape width at 96dpi
const PX_H = Math.round((PX_W * 210) / 297)

export async function downloadPdf(pages: CertPage[], filename = "honorhub-certificates.pdf"): Promise<void> {
  if (!pages.length) return
  const [{ jsPDF }, { toCanvas }] = await Promise.all([import("jspdf"), import("html-to-image")])

  // Make sure web fonts (Fraunces, Great Vibes, …) are ready before snapshotting.
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }

  const host = document.createElement("div")
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PX_W}px;pointer-events:none;opacity:1;`
  document.body.appendChild(host)

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  try {
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      const el = document.createElement("div")
      el.className = `cert t-${p.fields.template}`
      el.style.cssText = `width:${PX_W}px;height:${PX_H}px;animation:none;`
      el.style.setProperty("--accent", p.fields.accent)
      el.innerHTML = certInnerHTML(p.fields, p.recipient)
      host.appendChild(el)

      const canvas = await toCanvas(el, { pixelRatio: 2, backgroundColor: "#ffffff", width: PX_W, height: PX_H, cacheBust: true })
      if (i > 0) pdf.addPage()
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210)
      host.removeChild(el)
    }
    pdf.save(filename)
  } finally {
    host.remove()
  }
}
