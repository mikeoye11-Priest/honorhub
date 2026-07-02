// Custom (bring-your-own) certificate templates. A school uploads their own
// design (image, or a PDF whose first page we rasterise) and positions the
// recipient/award/date/etc. fields on top of it. The template + layout are org
// branding (stored); recipient names/messages stay session-only.
import { useCallback, useEffect, useState } from "react"
// Static ?url import — just the worker's URL string; the pdfjs library itself is
// lazy-imported below so it stays out of the main bundle.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { supabase } from "./supabase"
import { useAuth } from "./auth"

export type CustomFieldKey = "name" | "award" | "reason" | "date" | "signatory" | "org"
export type FieldFont = "serif" | "sans" | "script"

export interface CustomField {
  key: CustomFieldKey
  x: number // 0–1, centre X (fraction of width)
  y: number // 0–1, centre Y (fraction of height)
  width: number // 0–1, box width (fraction of width)
  fontSize: number // fraction of template width — rendered as cqw so it scales at any size
  color: string
  align: "left" | "center" | "right"
  weight: 400 | 600 | 700
  uppercase: boolean
  font: FieldFont
}

export interface CustomTemplate {
  id: string
  name: string
  background: string // data URL
  aspect: number // width / height
  fields: CustomField[]
}

/** The subset a certificate needs to render an uploaded template. */
export type CustomLayout = Pick<CustomTemplate, "background" | "aspect" | "fields">

export const FIELD_LABELS: Record<CustomFieldKey, string> = {
  name: "Recipient name",
  award: "Award title",
  reason: "Message / reason",
  date: "Date",
  signatory: "Signed by",
  org: "Organisation",
}

/** A sensible starting layout for a fresh upload — the user then drags to taste. */
export function defaultFields(): CustomField[] {
  return [
    { key: "org", x: 0.5, y: 0.15, width: 0.8, fontSize: 0.022, color: "#555555", align: "center", weight: 600, uppercase: true, font: "sans" },
    { key: "award", x: 0.5, y: 0.31, width: 0.8, fontSize: 0.05, color: "#1f2937", align: "center", weight: 700, uppercase: false, font: "serif" },
    { key: "name", x: 0.5, y: 0.5, width: 0.82, fontSize: 0.07, color: "#111827", align: "center", weight: 700, uppercase: false, font: "serif" },
    { key: "reason", x: 0.5, y: 0.66, width: 0.72, fontSize: 0.026, color: "#4b5563", align: "center", weight: 400, uppercase: false, font: "serif" },
    { key: "signatory", x: 0.27, y: 0.86, width: 0.32, fontSize: 0.022, color: "#374151", align: "center", weight: 600, uppercase: false, font: "serif" },
    { key: "date", x: 0.73, y: 0.86, width: 0.32, fontSize: 0.022, color: "#374151", align: "center", weight: 600, uppercase: false, font: "serif" },
  ]
}

// ---------------------------------------------------------------------------
// Upload → background image + aspect (accepts image OR PDF)
// ---------------------------------------------------------------------------

const MAX_W = 1800 // cap the stored image so DB rows stay reasonable

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error("read failed"))
    r.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("image load failed"))
    img.src = src
  })
}

/** Draw onto a white canvas capped at MAX_W and return a compact JPEG data URL. */
function toCompactDataURL(source: CanvasImageSource, w: number, h: number): string {
  const scale = w > MAX_W ? MAX_W / w : 1
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.9)
}

async function pdfToBackground(file: File): Promise<{ background: string; aspect: number }> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const page = await doc.getPage(1)
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  const background = toCompactDataURL(canvas, canvas.width, canvas.height)
  return { background, aspect: viewport.width / viewport.height }
}

/** Turn an uploaded file (image or PDF) into a stored background + aspect ratio. */
export async function fileToBackground(file: File): Promise<{ background: string; aspect: number }> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (isPdf) return pdfToBackground(file)
  const img = await loadImage(await readAsDataURL(file))
  const background = toCompactDataURL(img, img.naturalWidth, img.naturalHeight)
  return { background, aspect: img.naturalWidth / img.naturalHeight }
}

// ---------------------------------------------------------------------------
// Persistence — one org's custom templates
// ---------------------------------------------------------------------------

interface CustomTemplateRow {
  id: string
  name: string
  background: string
  aspect: number
  fields: CustomField[]
}

const rowToTemplate = (r: CustomTemplateRow): CustomTemplate => ({
  id: r.id,
  name: r.name,
  background: r.background,
  aspect: Number(r.aspect) || 1.4142,
  fields: Array.isArray(r.fields) ? r.fields : [],
})

export interface NewCustomTemplate {
  name: string
  background: string
  aspect: number
  fields: CustomField[]
}

export function useCustomTemplates() {
  const { configured, activeOrgId } = useAuth()
  const live = configured && Boolean(activeOrgId)
  const [templates, setTemplates] = useState<CustomTemplate[]>([])
  const [loading, setLoading] = useState(live)

  const load = useCallback(async () => {
    if (!supabase || !activeOrgId) return
    setLoading(true)
    const { data } = await supabase
      .from("custom_templates")
      .select("id, name, background, aspect, fields")
      .eq("organisation_id", activeOrgId)
      .order("created_at", { ascending: false })
    setTemplates((data ?? []).map((r) => rowToTemplate(r as CustomTemplateRow)))
    setLoading(false)
  }, [activeOrgId])

  useEffect(() => {
    if (!live) {
      setTemplates([])
      setLoading(false)
      return
    }
    void load()
  }, [live, load])

  const createTemplate = async (input: NewCustomTemplate): Promise<CustomTemplate | null> => {
    if (!supabase || !activeOrgId) return null
    const { data: auth } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from("custom_templates")
      .insert({
        organisation_id: activeOrgId,
        created_by: auth.user?.id ?? null,
        name: input.name,
        background: input.background,
        aspect: input.aspect,
        fields: input.fields,
      })
      .select("id, name, background, aspect, fields")
      .single()
    if (error || !data) return null
    const created = rowToTemplate(data as CustomTemplateRow)
    setTemplates((cur) => [created, ...cur])
    return created
  }

  const deleteTemplate = async (id: string): Promise<void> => {
    if (!supabase) return
    await supabase.from("custom_templates").delete().eq("id", id)
    setTemplates((cur) => cur.filter((t) => t.id !== id))
  }

  return { templates, loading, live, createTemplate, deleteTemplate, reload: load }
}
