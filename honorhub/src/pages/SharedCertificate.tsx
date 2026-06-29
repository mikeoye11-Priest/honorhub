import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Award, Download, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Certificate } from "@/components/Certificate"
import { fetchSharedCertificate, type SharedCertificate } from "@/lib/share"
import { downloadPdf } from "@/lib/pdf"

export default function SharedCertificatePage() {
  const { slug } = useParams<{ slug: string }>()
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading")
  const [cert, setCert] = useState<SharedCertificate | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  useEffect(() => {
    let active = true
    if (!slug) {
      setState("missing")
      return
    }
    fetchSharedCertificate(slug).then((c) => {
      if (!active) return
      if (c) {
        setCert(c)
        setState("ready")
      } else {
        setState("missing")
      }
    })
    return () => {
      active = false
    }
  }, [slug])

  async function download() {
    if (!cert) return
    setPdfBusy(true)
    const id = toast.loading("Building your PDF…")
    try {
      await downloadPdf([{ fields: cert.fields, recipient: cert.recipient }], `honorhub-${cert.recipient.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "certificate"}.pdf`)
      toast.success("PDF downloaded", { id })
    } catch {
      toast.error("Couldn't build the PDF", { id })
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Award className="size-5" />
          </span>
          HonorHub
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Create your own</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
        {state === "loading" && (
          <div className="grid place-items-center py-24">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {state === "missing" && (
          <div className="mx-auto grid max-w-md place-items-center rounded-2xl border border-dashed bg-card py-20 text-center">
            <Share2 className="size-8 text-muted-foreground/50" />
            <h1 className="mt-3 text-xl font-semibold">Certificate not found</h1>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              This share link is invalid or has been removed. Ask the sender for an up-to-date link.
            </p>
            <Button asChild className="mt-5">
              <Link to="/">Go to HonorHub</Link>
            </Button>
          </div>
        )}

        {state === "ready" && cert && (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">{cert.fields.org}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {cert.recipient.name} — {cert.fields.award}
              </h1>
            </div>
            <div className="rounded-2xl border bg-card p-3 shadow-soft sm:p-5">
              <div className="overflow-hidden rounded-xl ring-1 ring-border">
                <Certificate fields={cert.fields} recipient={cert.recipient} />
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={download} disabled={pdfBusy}>
                {pdfBusy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Download PDF
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
