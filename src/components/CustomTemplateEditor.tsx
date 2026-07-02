import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Upload, Loader2, X, Type, AlignLeft, AlignCenter, AlignRight, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useHonor } from "@/lib/store"
import { todayUK } from "@/lib/honor"
import {
  fileToBackground,
  defaultFields,
  FIELD_LABELS,
  useCustomTemplates,
  type CustomField,
  type CustomFieldKey,
  type CustomTemplate,
  type FieldFont,
} from "@/lib/custom-templates"

const ALL_KEYS: CustomFieldKey[] = ["name", "award", "reason", "date", "signatory", "org"]
const FONT_CSS: Record<FieldFont, string> = { serif: "var(--serif)", sans: "var(--ui)", script: "var(--script)" }
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function CustomTemplateEditor({ onClose, onSaved }: { onClose: () => void; onSaved?: (t: CustomTemplate) => void }) {
  const h = useHonor()
  const { createTemplate } = useCustomTemplates()
  const [name, setName] = useState("")
  const [background, setBackground] = useState<string | null>(null)
  const [aspect, setAspect] = useState(297 / 210)
  const [fields, setFields] = useState<CustomField[]>([])
  const [selected, setSelected] = useState<CustomFieldKey | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ key: CustomFieldKey; pointerId: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Sample values so the school sees a realistic layout while positioning.
  const sample = (key: CustomFieldKey): string => {
    switch (key) {
      case "name":
        return "Amelia Cole"
      case "award":
        return h.award || "Star of the Week"
      case "reason":
        return h.defaultReason || "for wonderful effort this week"
      case "date":
        return h.date || todayUK()
      case "signatory":
        return h.signatory || "Mrs Hart · Class 3"
      case "org":
        return h.org || "Your School"
    }
  }

  async function onFile(file: File) {
    setUploading(true)
    try {
      const { background: bg, aspect: ar } = await fileToBackground(file)
      setBackground(bg)
      setAspect(ar)
      setFields(defaultFields())
      setSelected("name")
      if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ""))
    } catch {
      toast.error("Couldn't read that file", { description: "Upload a PNG/JPG image or a PDF of your certificate." })
    } finally {
      setUploading(false)
    }
  }

  const updateField = (key: CustomFieldKey, patch: Partial<CustomField>) =>
    setFields((cur) => cur.map((f) => (f.key === key ? { ...f, ...patch } : f)))

  const toggleField = (key: CustomFieldKey) =>
    setFields((cur) => {
      if (cur.some((f) => f.key === key)) return cur.filter((f) => f.key !== key)
      const def = defaultFields().find((f) => f.key === key)!
      return [...cur, def]
    })

  const startDrag = (e: ReactPointerEvent, key: CustomFieldKey) => {
    e.preventDefault()
    setSelected(key)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { key, pointerId: e.pointerId }
  }
  const onDrag = (e: ReactPointerEvent) => {
    const drag = dragRef.current
    const board = boardRef.current
    if (!drag || !board) return
    const rect = board.getBoundingClientRect()
    updateField(drag.key, {
      x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
    })
  }
  const endDrag = (e: ReactPointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  async function save() {
    if (!background || !name.trim() || !fields.length) return
    setSaving(true)
    const created = await createTemplate({ name: name.trim(), background, aspect, fields })
    setSaving(false)
    if (created) {
      toast.success(`"${created.name}" saved`, { description: "Your template is ready to use in Create." })
      onSaved?.(created)
      onClose()
    } else {
      toast.error("Couldn't save the template", { description: "Only admins can add templates, and you must be signed in." })
    }
  }

  const selectedField = fields.find((f) => f.key === selected) ?? null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-lg font-bold">Upload your own template</h2>
          <p className="text-xs text-muted-foreground">Upload your certificate design, then drag the fields where they should print.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            <X className="size-4" /> Cancel
          </Button>
          <Button onClick={save} disabled={!background || !name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save template
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="flex items-center justify-center overflow-auto bg-muted/40 p-6">
          {!background ? (
            <label className="grid min-h-64 w-full max-w-2xl cursor-pointer place-items-center rounded-2xl border-2 border-dashed bg-card p-10 text-center transition hover:border-primary">
              {uploading ? (
                <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-primary" /> Reading your file…
                </span>
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="size-8" />
                  <span className="font-semibold text-foreground">Upload your certificate</span>
                  <span className="text-sm">PNG, JPG or PDF — landscape or portrait</span>
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void onFile(f)
                  e.target.value = ""
                }}
              />
            </label>
          ) : (
            <div
              ref={boardRef}
              className="relative w-full max-w-4xl select-none overflow-hidden rounded-lg shadow-soft ring-1 ring-border"
              style={{ aspectRatio: String(aspect), containerType: "inline-size" }}
            >
              <img src={background} alt="template" className="pointer-events-none absolute inset-0 h-full w-full" style={{ objectFit: "fill" }} />
              {fields.map((f) => {
                const active = selected === f.key
                return (
                  <div
                    key={f.key}
                    onPointerDown={(e) => startDrag(e, f.key)}
                    onPointerMove={onDrag}
                    onPointerUp={endDrag}
                    className={`absolute cursor-move touch-none rounded px-0.5 ${active ? "outline-dashed outline-2 outline-primary" : "outline-dashed outline-1 outline-primary/30"}`}
                    style={{
                      left: `${f.x * 100}%`,
                      top: `${f.y * 100}%`,
                      width: `${f.width * 100}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${f.fontSize * 100}cqw`,
                      color: f.color,
                      textAlign: f.align,
                      fontWeight: f.weight,
                      fontFamily: FONT_CSS[f.font],
                      lineHeight: 1.18,
                    }}
                  >
                    {f.uppercase ? sample(f.key).toUpperCase() : sample(f.key)}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        <aside className="flex flex-col gap-4 overflow-y-auto border-t p-4 lg:border-l lg:border-t-0">
          <div className="grid gap-1.5">
            <Label htmlFor="tpl-name">Template name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Our School Certificate" />
          </div>

          {background && (
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Replace background
            </Button>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fields</p>
            <div className="flex flex-col gap-1">
              {ALL_KEYS.map((key) => {
                const on = fields.some((f) => f.key === key)
                return (
                  <div key={key} className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-sm ${selected === key ? "border-primary bg-accent/40" : ""}`}>
                    <button className="flex-1 text-left font-medium" onClick={() => setSelected(key)}>
                      {FIELD_LABELS[key]}
                    </button>
                    <button className="text-muted-foreground hover:text-primary" onClick={() => toggleField(key)} aria-label={on ? "Hide field" : "Show field"}>
                      {on ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedField && (
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Type className="size-4 text-primary" /> {FIELD_LABELS[selectedField.key]}
              </p>
              <div className="grid gap-1.5">
                <Label className="text-xs">Size</Label>
                <input type="range" min={1} max={12} step={0.5} value={selectedField.fontSize * 100} onChange={(e) => updateField(selectedField.key, { fontSize: Number(e.target.value) / 100 })} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Box width</Label>
                <input type="range" min={20} max={100} step={1} value={selectedField.width * 100} onChange={(e) => updateField(selectedField.key, { width: Number(e.target.value) / 100 })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Colour</Label>
                <input type="color" value={selectedField.color} onChange={(e) => updateField(selectedField.key, { color: e.target.value })} className="h-8 w-12 cursor-pointer rounded border" />
              </div>
              <div className="flex items-center gap-1">
                {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
                  <Button key={a} variant={selectedField.align === a ? "default" : "outline"} size="icon" onClick={() => updateField(selectedField.key, { align: a })} aria-label={a}>
                    <Icon className="size-4" />
                  </Button>
                ))}
                <div className="ml-auto flex gap-1">
                  {([400, 600, 700] as const).map((w) => (
                    <Button key={w} variant={selectedField.weight === w ? "default" : "outline"} size="sm" onClick={() => updateField(selectedField.key, { weight: w })}>
                      {w === 400 ? "Reg" : w === 600 ? "Semi" : "Bold"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedField.font}
                  onChange={(e) => updateField(selectedField.key, { font: e.target.value as FieldFont })}
                  className="flex-1 rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none"
                >
                  <option value="serif">Serif</option>
                  <option value="sans">Sans</option>
                  <option value="script">Script</option>
                </select>
                <Button variant={selectedField.uppercase ? "default" : "outline"} size="sm" onClick={() => updateField(selectedField.key, { uppercase: !selectedField.uppercase })}>
                  UPPER
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
