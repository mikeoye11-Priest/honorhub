import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import {
  Award,
  Users,
  MessageSquare,
  Eye,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Upload,
  Loader2,
  Trash2,
  Download,
  Share2,
  Plus,
  LayoutDashboard,
  X,
  Info,
  Globe,
  ShieldCheck,
  Package,
  Printer,
  Link2,
  FileImage,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Certificate, printPages, type CertFields, type CertPage } from "@/components/Certificate"
import { Confetti } from "@/components/Confetti"
import { useHonor } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { VERTICALS, TEMPLATES, ACCENTS, parseRecipients } from "@/lib/honor"
import { COLLECTIONS, getPack } from "@/lib/catalog"
import { downloadPdf, buildShareFile, usesNativePdfDialog } from "@/lib/pdf"
import { usePacks } from "@/lib/packs"
import { recordExport } from "@/lib/exports"
import { createShareLink } from "@/lib/share"

// Rough time saved vs producing each certificate by hand (~4 min each).
function timeSavedLabel(certs: number): string {
  const mins = certs * 4
  if (mins < 60) return `~${mins} min`
  const hrs = mins / 60
  return `~${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} hr`
}

const STEPS = [
  { label: "Choose Award", icon: Award },
  { label: "Recipients", icon: Users },
  { label: "Message", icon: MessageSquare },
  { label: "Preview", icon: Eye },
  { label: "Generate", icon: Sparkles },
]

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [],
    cur = "",
    q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else q = false
      } else cur += c
    } else if (c === '"') q = true
    else if (c === ",") {
      row.push(cur)
      cur = ""
    } else if (c === "\n") {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ""
    } else if (c !== "\r") cur += c
  }
  if (cur !== "" || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows.filter((r) => r.some((x) => x.trim()))
}

export default function Create() {
  const navigate = useNavigate()
  const h = useHonor()
  const { activeOrgId, configured } = useAuth()
  const v = VERTICALS[h.vertical]
  const [step, setStep] = useState(0)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [packItemIdx, setPackItemIdx] = useState(0)
  const [aiBusy, setAiBusy] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [linkBusy, setLinkBusy] = useState(false)
  // Pre-built shareable file, so navigator.share() can fire inside the click
  // handler before the user-activation expires (rendering can take a few seconds).
  const shareFileRef = useRef<File | null>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  // Pack mode: a Recognition Pack generates several matched certificate designs per recipient.
  // Resolve from the merged list (built-ins + this org's saved packs), falling back to static.
  const { getPackByKey } = usePacks()
  const pack = getPackByKey(h.packKey) ?? getPack(h.packKey)
  const packCertItems = pack ? pack.items.filter((i) => i.kind === "certificate") : []
  const packExtras = pack ? pack.items.filter((i) => i.kind !== "certificate") : []
  const activeItem = pack ? packCertItems[Math.min(packItemIdx, packCertItems.length - 1)] : undefined
  const activeAward = activeItem ? activeItem.label : h.award

  const fields: CertFields = {
    template: h.template,
    accent: h.accent,
    logo: h.logo,
    org: h.org,
    award: activeAward,
    date: h.date,
    signatory: h.signatory,
  }
  const recipientCount = parseRecipients(h.recipientsRaw, h.defaultReason).length
  const totalCerts = pack ? packCertItems.length * recipientCount : recipientCount
  const idx = Math.min(previewIndex, Math.max(0, h.recipients.length - 1))
  const awards = COLLECTIONS[h.vertical] ?? []

  // One page per (certificate-item × recipient) in pack mode, else one per recipient.
  const buildPages = (): CertPage[] =>
    pack
      ? packCertItems.flatMap((it) => h.recipients.map((r) => ({ fields: { ...fields, award: it.label }, recipient: r })))
      : h.recipients.map((r) => ({ fields, recipient: r }))

  const logExport = (format: string) =>
    void recordExport(activeOrgId, { count: totalCerts, template: h.template, award: pack ? pack.name : h.award, packKey: h.packKey, format })

  const fileBase = `honorhub-${(pack ? pack.name : h.award).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "certificates"}`

  async function doDownloadPdf() {
    const pages = buildPages()
    if (!pages.length) return
    setPdfBusy(true)
    const nativePdf = usesNativePdfDialog()
    const id = toast.loading(
      nativePdf
        ? `Opening Chrome's Save as PDF dialog (${pages.length} ${pages.length === 1 ? "certificate" : "certificates"})…`
        : `Building your PDF (${pages.length} ${pages.length === 1 ? "certificate" : "certificates"})…`,
    )
    try {
      await downloadPdf(pages, `${fileBase}.pdf`)
      toast.success(nativePdf ? "Choose Save as PDF in the print dialog" : "PDF downloaded", { id })
      logExport("pdf")
    } catch {
      toast.error("Couldn't build the PDF", { id })
    } finally {
      setPdfBusy(false)
    }
  }

  const doPrint = () => {
    const pages = buildPages()
    if (!pages.length) return
    printPages(pages)
    logExport("print")
  }

  function downloadFile(file: File, id: string | number, description: string) {
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Certificate saved", { id, description })
    logExport("share")
  }

  async function doShare() {
    const pages = buildPages()
    if (!pages.length) return
    setShareBusy(true)
    const id = toast.loading("Preparing your certificate to share…")

    // Use the file pre-built when this screen mounted; only build now if needed.
    let file = shareFileRef.current
    if (!file) {
      try {
        file = await buildShareFile(pages, fileBase)
        shareFileRef.current = file
      } catch {
        toast.error("Couldn't prepare the certificate to share", { id })
        setShareBusy(false)
        return
      }
    }

    const title = `${pack ? pack.name : h.award} — ${h.org}`
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
    setShareBusy(false)

    if (!nav.share || !nav.canShare?.({ files: [file] })) {
      // No file-share support (e.g. desktop Firefox): download to share manually.
      downloadFile(file, id, "Your browser has no share sheet, so we downloaded it to share manually.")
      return
    }

    try {
      // Fired synchronously after the (fast) ref lookup, so user-activation holds.
      await nav.share({ files: [file], title, text: title })
      toast.success("Shared", { id })
      logExport("share")
    } catch (err) {
      // Cancelling the share sheet throws AbortError — treat as a silent no-op.
      if ((err as Error)?.name === "AbortError") {
        toast.dismiss(id)
        return
      }
      // Anything else (activation expired, no targets): fall back to a download.
      downloadFile(file, id, "Sharing wasn't available, so we downloaded it instead.")
    }
  }

  // Saves the currently-previewed certificate to the backend and copies a public
  // link. Only offered when signed in with an active org (demo mode can't store).
  const canShareLink = configured && Boolean(activeOrgId)
  async function doCopyLink() {
    const recipient = h.recipients[idx]
    if (!recipient) return
    setLinkBusy(true)
    const id = toast.loading("Creating a share link…")
    try {
      const url = await createShareLink(activeOrgId, { fields, recipient })
      if (!url) {
        toast.error("Couldn't create the share link", { id })
        return
      }
      try {
        await navigator.clipboard?.writeText(url)
        toast.success("Share link copied", { id, description: `Anyone with the link can view ${recipient.name}'s certificate.` })
      } catch {
        toast.success("Share link created", { id, description: url })
      }
      logExport("link")
    } catch {
      toast.error("Couldn't create the share link", { id })
    } finally {
      setLinkBusy(false)
    }
  }

  // Pre-render the shareable file as soon as the success screen appears, so the
  // Share click can hand it straight to navigator.share() before activation lapses.
  useEffect(() => {
    if (step !== 4) {
      shareFileRef.current = null
      return
    }
    let cancelled = false
    buildShareFile(buildPages(), fileBase)
      .then((f) => {
        if (!cancelled) shareFileRef.current = f
      })
      .catch(() => {
        /* fall back to building on click */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Turn parsed rows (from CSV or a spreadsheet) into "Name — Comment" lines.
  // Column A = name, column B = comment; a header row is auto-detected.
  function importRows(rows: unknown[][]) {
    const cell = (v: unknown) => (v == null ? "" : String(v)).trim()
    const data = rows.filter((r) => Array.isArray(r) && r.some((x) => cell(x)))
    if (!data.length) {
      toast("No rows found", { description: "The file looked empty." })
      return
    }
    const start = /name|pupil|child|recipient|first|forename/.test(cell(data[0][0]).toLowerCase()) ? 1 : 0
    const lines = data
      .slice(start)
      .map((c) => {
        const name = cell(c[0])
        const reason = cell(c[1])
        return reason ? `${name} — ${reason}` : name
      })
      .filter(Boolean)
    if (lines.length) {
      h.setRecipientsRaw(lines.join("\n"))
      toast.success(`Imported ${lines.length} recipient${lines.length === 1 ? "" : "s"}`)
    } else {
      toast("No names found", { description: "Check that the first column contains names." })
    }
  }

  async function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    const name = f.name.toLowerCase()
    try {
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        // Excel: parse the first sheet. xlsx is lazy-loaded so it stays out of the main bundle.
        const XLSX = await import("xlsx")
        const wb = XLSX.read(await f.arrayBuffer(), { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        if (!ws) throw new Error("empty workbook")
        importRows(XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" }) as unknown[][])
      } else {
        importRows(parseCSV(await f.text()))
      }
    } catch {
      toast.error("Couldn't read that file", { description: "Use the template, saved as CSV or Excel (.xlsx)." })
    }
  }

  // A ready-to-fill spreadsheet: column A = Name, column B = Comment (optional).
  // Opens in Excel / Google Sheets; re-upload it via "Upload CSV".
  function downloadTemplate() {
    const rows = [
      ["Name", "Comment"],
      ["Amelia Cole", "For beautiful, careful handwriting all week"],
      ["Noah Bryant", "For being a kind and helpful friend"],
      ["Priya Shah", "For fantastic ideas in our science lesson"],
      ["Leo Walsh", ""],
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    // ﻿ (BOM) makes Excel open it as UTF-8 so accents/quotes render correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "honorhub-recipients-template.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Template downloaded", { description: "Add a name (and optional comment) per row, then Upload CSV." })
  }

  function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => h.setLogo(String(r.result))
    r.readAsDataURL(f)
    e.target.value = ""
  }

  async function writeWithAI() {
    const recs = h.recipients
    if (!recs.length) return
    setAiBusy(true)
    const notes = recs.map((p, i) => `${i + 1}. ${p.reason}`).join("\n")
    const prompt = `You write short award-recognition lines for HonorHub.
Context: ${v.label}. Tone: ${v.tone}.
You are given a numbered list of short notes (keywords or rough phrases). You are NOT given recipients' names and do not need them.
Rewrite each as ONE warm, specific, encouraging line for a certificate.
Rules: British English. No clichés, emojis or exclamation marks. Begin each with lower-case "for". 8 to 16 words. Keep the note's detail; invent nothing. Vary the wording.
Notes:
${notes}
Respond with ONLY a JSON array of strings in order, no prose or fences.`
    try {
      const res = await fetch("/api/reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error("request failed (" + res.status + ")")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const arr = JSON.parse(String(data.text || "").replace(/```json|```/g, "").trim())
      const lines = recs.map((p, i) => {
        const g = arr[i]
        const reason = typeof g === "string" ? g.trim() : g?.reason ? String(g.reason).trim() : ""
        return `${p.name} — ${reason || p.reason}`
      })
      h.setRecipientsRaw(lines.join("\n"))
      toast.success("AI rewrote the recognition messages")
    } catch {
      toast.error("AI writer unavailable", {
        description: "Needs the /api/reasons function and ANTHROPIC_API_KEY (works once deployed).",
      })
    } finally {
      setAiBusy(false)
    }
  }

  /* ---------------- Step 5: success ---------------- */
  if (step === 4) {
    return (
      <div className="relative -m-4 min-h-[calc(100vh-4rem)] overflow-hidden sm:-m-6">
        <Confetti />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-12 text-center">
          <div className="relative mb-6">
            <div className="grid size-24 animate-pulse place-items-center rounded-full bg-success/10">
              <Award className="size-14 text-success" />
            </div>
            <Sparkles className="absolute -right-3 -top-1 size-5 animate-pulse text-warning" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Recognition generated successfully! 🎉</h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            {pack
              ? `Your ${pack.name} is ready — ${totalCerts} matched certificate${totalCerts === 1 ? "" : "s"} across ${packCertItems.length} designs.`
              : `Your celebration of excellence is ready — ${recipientCount === 1 ? "a premium certificate" : `${recipientCount} premium certificates`}, ready to print, share or hand out.`}
          </p>
          {pack && packExtras.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Also included:</span>
              {packExtras.map((e) => (
                <span key={e.label} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">{e.label}</span>
              ))}
            </div>
          )}

          <div className="mt-8 grid w-full gap-6 md:grid-cols-12">
            <div className="rounded-xl border bg-card p-4 shadow-sm md:col-span-7">
              <div className="overflow-hidden rounded-lg ring-1 ring-border">
                <Certificate fields={fields} recipient={h.recipients[idx]} />
              </div>
              <div className="mt-3 flex items-center justify-between px-1 text-left">
                <div>
                  <h4 className="font-semibold">{activeAward}</h4>
                  <p className="text-xs text-muted-foreground">Recipient: {h.recipients[idx]?.name ?? "—"}</p>
                </div>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Active</span>
              </div>
            </div>

            <div className="flex flex-col gap-6 md:col-span-5">
              <div className="rounded-xl border bg-card p-5 text-left shadow-sm">
                <h4 className="mb-3 font-semibold">Impact summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { k: "Recipients", v: String(recipientCount) },
                    { k: "Certificates", v: String(totalCerts) },
                    { k: "Time saved", v: timeSavedLabel(totalCerts) },
                    { k: "Designs", v: String(pack ? packCertItems.length : 1) },
                  ].map((m) => (
                    <div key={m.k} className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">{m.k}</p>
                      <p className="text-2xl font-bold text-primary">{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="lg" onClick={doDownloadPdf} disabled={pdfBusy}>
                  {pdfBusy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Download PDF
                </Button>
                <div className="flex gap-2">
                  <Button size="lg" variant="outline" className="flex-1" onClick={doPrint}>
                    <Printer className="size-4" /> Print
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="lg" variant="outline" className="flex-1" disabled={shareBusy || linkBusy}>
                        {shareBusy || linkBusy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />} Share
                        <ChevronDown className="size-4 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuItem onSelect={doShare}>
                        <FileImage className="size-4" />
                        <div>
                          <p className="font-medium">Share certificate file</p>
                          <p className="text-xs text-muted-foreground">Send the image or PDF directly</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={doCopyLink} disabled={!canShareLink}>
                        <Link2 className="size-4" />
                        <div>
                          <p className="font-medium">Copy share link</p>
                          <p className="text-xs text-muted-foreground">
                            {canShareLink ? "A public link to this certificate" : "Sign in to create share links"}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 border-t pt-8 sm:flex-row sm:justify-center">
            <button onClick={() => setStep(0)} className="flex items-center gap-2 font-medium text-primary hover:underline">
              <Plus className="size-5" /> Create another recognition
            </button>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <button onClick={() => navigate("/")} className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="size-5" /> Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------- Wizard shell ---------------- */
  const canAdvance = step !== 1 || recipientCount > 0

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      {/* Step rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-xl border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Award className="size-5 text-primary" />
            <div>
              <p className="text-sm font-bold leading-none text-primary">Recognition Wizard</p>
              <p className="mt-1 text-xs text-muted-foreground">Step {step + 1} of 5</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {STEPS.map((s, i) => {
              const done = i < step
              const active = i === step
              return (
                <button
                  key={s.label}
                  onClick={() => i <= step && setStep(i)}
                  className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-accent font-bold text-accent-foreground"
                      : done
                        ? "border-transparent text-success hover:bg-muted/50"
                        : "border-transparent text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="size-5" /> : <s.icon className="size-5" />}
                  <span>{s.label}</span>
                </button>
              )
            })}
          </nav>
          <button
            onClick={() => navigate("/")}
            className="mt-3 flex w-full items-center gap-2 border-t px-3 pt-3 text-sm text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" /> Cancel wizard
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        <div className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,400px)]">
          {/* Step content */}
          <div className="flex flex-col gap-5">
            {step === 0 && (
              <section className="flex flex-col gap-4">
                {pack ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-3xl font-semibold tracking-tight">{pack.name}</h2>
                        <p className="mt-1 text-muted-foreground">{pack.blurb} One click generates every design for every recipient.</p>
                      </div>
                      <Button variant="ghost" onClick={() => h.setPack(null)}>
                        <X className="size-4" /> Clear pack
                      </Button>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-accent/40 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Package className="size-4 text-primary" /> Certificates in this pack — tap to preview
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {packCertItems.map((it, i) => (
                          <button
                            key={it.label}
                            onClick={() => setPackItemIdx(i)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              i === packItemIdx ? "border-primary bg-card ring-1 ring-primary" : "bg-card/60 hover:bg-card"
                            }`}
                          >
                            {it.label}
                          </button>
                        ))}
                      </div>
                      {packExtras.length > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">Also produced: {packExtras.map((e) => e.label).join(", ")}.</p>
                      )}
                    </div>
                    <div className="grid gap-1.5 sm:max-w-xs">
                      <Label htmlFor="sig">Signed by</Label>
                      <Input id="sig" value={h.signatory} onChange={(e) => h.setField("signatory", e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-3xl font-semibold tracking-tight">What are you recognising?</h2>
                      <p className="mt-1 text-muted-foreground">Pick an award — the certificate is simply the result.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {awards.map((a) => {
                        const active = h.award === a.name
                        return (
                          <button
                            key={a.name}
                            onClick={() => h.setField("award", a.name)}
                            className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition hover:shadow-sm ${
                              active ? "border-primary bg-accent ring-1 ring-primary" : "bg-card"
                            }`}
                          >
                            <span className="text-2xl">{a.icon}</span>
                            <span className="text-sm font-semibold leading-tight">{a.name}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="award">Award title</Label>
                        <Input id="award" value={h.award} onChange={(e) => h.setField("award", e.target.value)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="sig">Signed by</Label>
                        <Input id="sig" value={h.signatory} onChange={(e) => h.setField("signatory", e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

            {step === 1 && (
              <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight">Add recipients</h2>
                    <p className="mt-1 text-muted-foreground">One per line. Add a note after a dash. Session-only — never stored.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="size-4" /> Download template
                    </Button>
                    <Button variant="outline" onClick={() => csvRef.current?.click()}>
                      <Upload className="size-4" /> Upload CSV / Excel
                    </Button>
                  </div>
                  <input ref={csvRef} type="file" accept=".csv,.txt,.xlsx,.xls" hidden onChange={onUpload} />
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-primary/10 bg-accent/40 p-3 text-xs text-accent-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <p>
                    <span className="font-semibold">Spreadsheet format:</span> column A = <span className="font-medium">Name</span>, column B = <span className="font-medium">Comment</span> (optional).
                    Works with Excel (<span className="font-medium">.xlsx</span>), Google Sheets and <span className="font-medium">.csv</span> — fill in the template and upload. A header row is detected automatically.
                  </p>
                </div>
                <Textarea
                  value={h.recipientsRaw}
                  onChange={(e) => h.setRecipientsRaw(e.target.value)}
                  spellCheck={false}
                  className="min-h-64 font-mono text-sm"
                  placeholder="Amelia Cole — for careful handwriting all week"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{recipientCount} recipients</span>
                  {recipientCount > 0 && (
                    <button className="flex items-center gap-1 text-destructive" onClick={h.clearRecipients}>
                      <Trash2 className="size-3.5" /> Clear
                    </button>
                  )}
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="flex flex-col gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Recognition message</h2>
                  <p className="mt-1 text-muted-foreground">Set a default message, or let AI rewrite your notes — names never leave the browser.</p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="reason">Default message (used when a recipient has none)</Label>
                  <Input id="reason" value={h.defaultReason} onChange={(e) => h.setField("defaultReason", e.target.value)} />
                </div>
                <div className="rounded-xl border border-primary/20 bg-accent/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="size-4 text-primary" /> AI Recognition Writer
                    </div>
                    <Button onClick={writeWithAI} disabled={aiBusy || recipientCount === 0}>
                      {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Rewrite messages
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tone adapts to {v.label.toLowerCase()}. Only achievement notes are sent — never names.
                  </p>
                </div>
                <Textarea
                  value={h.recipientsRaw}
                  onChange={(e) => h.setRecipientsRaw(e.target.value)}
                  spellCheck={false}
                  className="min-h-44 font-mono text-sm"
                />
              </section>
            )}

            {step === 3 && (
              <section className="flex flex-col gap-5">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Final preview</h2>
                  <p className="mt-1 text-muted-foreground">Review and polish before you generate.</p>
                </div>

                {/* Customise */}
                <div className="rounded-xl border bg-card p-4">
                  <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Template</Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => h.setTemplate(t.key)}
                        className={`rounded-lg border p-2 text-left transition hover:shadow-sm ${
                          h.template === t.key ? "border-primary ring-1 ring-primary" : "bg-card"
                        }`}
                      >
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground">{t.blurb}</div>
                      </button>
                    ))}
                  </div>
                  <Label className="mb-2 mt-4 block text-xs uppercase tracking-wide text-muted-foreground">Accent</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENTS.map((a) => (
                      <button
                        key={a.hex}
                        title={a.name}
                        onClick={() => h.setAccent(a.hex)}
                        className={`size-7 rounded-full ${h.accent === a.hex ? "ring-2 ring-foreground ring-offset-2" : ""}`}
                        style={{ background: a.hex }}
                      />
                    ))}
                    <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                      <Upload className="size-3.5" /> {h.logo ? "Replace logo" : "Add logo"}
                    </Button>
                    {h.logo && (
                      <button className="text-sm text-destructive" onClick={() => h.setLogo(null)}>
                        Remove
                      </button>
                    )}
                    <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogo} />
                  </div>
                </div>

                {/* Core details */}
                <div className="rounded-xl border bg-card p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Info className="size-4 text-primary" /> Core details
                  </h4>
                  <dl className="text-sm">
                    {[
                      ["Recipient", h.recipients[idx]?.name ?? "—"],
                      ["Award", activeAward],
                      ["Date", h.date],
                      ["Organisation", h.org],
                    ].map(([k, val], i, arr) => (
                      <div key={k} className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b" : ""}`}>
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-semibold">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Visibility */}
                <div className="rounded-xl border bg-card p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Eye className="size-4 text-primary" /> Privacy
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <ShieldCheck className="mt-0.5 size-4 text-success" />
                      <div>
                        <p className="text-sm font-semibold">Session-only by default</p>
                        <p className="text-xs text-muted-foreground">Recipient names stay in this browser and are never stored on our servers.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <Globe className="mt-0.5 size-4 text-info" />
                      <div>
                        <p className="text-sm font-semibold">Recognition Timeline (opt-in)</p>
                        <p className="text-xs text-muted-foreground">Enable the Recipient Directory to keep an achievement history.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-accent/40 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <p className="text-sm text-accent-foreground">
                    <span className="font-bold">AI insight:</span> specific, warm praise like this is shown to lift morale and retention.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Sticky live preview */}
          <aside className="xl:sticky xl:top-20 xl:self-start">
            <div className="overflow-hidden rounded-xl shadow-md ring-1 ring-border">
              <Certificate fields={fields} recipient={h.recipients[idx]} />
            </div>
            <div className="mt-3 flex items-center justify-center gap-3 text-sm">
              <Button variant="outline" size="icon" disabled={idx <= 0} onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-32 text-center font-medium">
                {h.recipients.length ? `${h.recipients[idx]?.name} · ${idx + 1}/${h.recipients.length}` : "No recipients"}
              </span>
              <Button variant="outline" size="icon" disabled={idx >= h.recipients.length - 1} onClick={() => setPreviewIndex((i) => i + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Badge variant="secondary" className="mt-3 w-full justify-center bg-accent text-accent-foreground">
              {pack ? `${pack.name} · ${activeAward}` : v.brand}
            </Badge>
          </aside>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between gap-3 border-t bg-background/80 py-4 backdrop-blur">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Next: {STEPS[step + 1].label} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => setStep(4)} disabled={recipientCount === 0}>
                <Sparkles className="size-4" /> Generate {totalCerts} certificate{totalCerts === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
