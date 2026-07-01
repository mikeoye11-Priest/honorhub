import { useState, type ElementType } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Copy,
  Check,
  Palette,
  Image,
  ShoppingBag,
  Package,
  Sparkles,
  Upload,
  ArrowRight,
  Trash2,
  Loader2,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Certificate } from "@/components/Certificate"
import { useHonor } from "@/lib/store"
import { TEMPLATES, ACCENTS, TEMPLATE_STYLES, TEMPLATE_TIERS, VERTICAL_LIST, VERTICALS, getRecommendedTemplates, getTemplate, templateSearchText, type TemplateDef, type VerticalKey } from "@/lib/honor"
import { COLLECTIONS, PREMIUM_COLLECTIONS, type PackItem, type OutputKind } from "@/lib/catalog"
import { usePacks, type NewPack } from "@/lib/packs"

function EmptyState({ icon: Icon, title, body, cta, onCta }: { icon: ElementType; title: string; body: string; cta: string; onCta?: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
      <Icon className="size-8 text-muted-foreground/50" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button className="mt-4" onClick={onCta}>{cta}</Button>
    </div>
  )
}

const BRAND_PRESETS: Array<{ key: string; name: string; blurb: string; template: string; accent: string; verticals: VerticalKey[] }> = [
  { key: "school-classic", name: "School Classic", blurb: "Warm, assembly-ready certificates", template: "laurel", accent: "#F58220", verticals: ["school"] },
  { key: "school-prestige", name: "Academic Prestige", blurb: "Formal awards for excellence", template: "sapphire", accent: "#C8A96A", verticals: ["school", "event"] },
  { key: "church-grace", name: "Ministry Grace", blurb: "Soft, respectful appreciation", template: "grace", accent: "#8A5A2B", verticals: ["church", "charity"] },
  { key: "sports-bold", name: "Club Champion", blurb: "Energetic club presentation style", template: "champion", accent: "#F58220", verticals: ["sports", "school"] },
  { key: "corporate-exec", name: "Executive Recognition", blurb: "Quiet, professional brand tone", template: "executive", accent: "#B8893A", verticals: ["company", "charity"] },
  { key: "event-gala", name: "Gala Ceremony", blurb: "Premium event-ready certificates", template: "onyx", accent: "#C8A96A", verticals: ["event", "company"] },
]

export default function Library() {
  const h = useHonor()
  const navigate = useNavigate()
  const activeVertical = VERTICALS[h.vertical]
  const [sector, setSector] = useState<VerticalKey | "all">(h.vertical)
  const [tplQuery, setTplQuery] = useState("")
  const [tplTier, setTplTier] = useState<TemplateDef["tier"] | "all">("all")
  const [tplStyle, setTplStyle] = useState<TemplateDef["style"] | "all">("all")
  const fields = { template: h.template, accent: h.accent, logo: h.logo, org: h.org, award: h.award, date: h.date, signatory: h.signatory }
  const currentTemplate = getTemplate(h.template)
  const suggestedTemplates = getRecommendedTemplates(h.vertical).slice(0, 4)
  const brandPresets = BRAND_PRESETS.filter((p) => p.verticals.includes(h.vertical))

  const q = tplQuery.trim().toLowerCase()
  const visibleTemplates = TEMPLATES.filter((t) => {
    const matchesSearch = q ? templateSearchText(t).includes(q) : true
    const matchesTier = tplTier === "all" || t.tier === tplTier
    const matchesStyle = tplStyle === "all" || t.style === tplStyle
    return matchesSearch && matchesTier && matchesStyle
  })

  const applyTemplate = (t: TemplateDef) => {
    h.setTemplate(t.key)
    h.setAccent(t.defaultAccent)
  }

  const applyBrandPreset = (preset: (typeof BRAND_PRESETS)[number]) => {
    h.setTemplate(preset.template)
    h.setAccent(preset.accent)
    toast.success(`${preset.name} applied`, { description: "Your default certificate style has been updated." })
  }

  const newTemplate = () => {
    toast("Design a new template", { description: "Pick a style and customise it in Create." })
    navigate("/create")
  }

  const startAward = (name: string) => {
    h.setPack(null)
    h.setField("award", name)
    navigate("/create")
  }

  const startPack = (key: string, firstAward: string) => {
    h.setPack(key)
    h.setField("award", firstAward)
    navigate("/create")
  }

  const { packs, loading: packsLoading, live: packsLive, createPack, deletePack } = usePacks()
  const [packSheetOpen, setPackSheetOpen] = useState(false)

  const sectorsForFilter = sector === "all" ? VERTICAL_LIST.map((v) => v.key) : [sector]
  const visiblePacks = packs.filter((p) => p.sectors.some((s) => sectorsForFilter.includes(s)))

  const openCreatePack = () => {
    if (!packsLive) {
      toast("Sign in to create packs", { description: "Custom Recognition Packs save to your organisation." })
      return
    }
    setPackSheetOpen(true)
  }

  const removePack = async (id: string, name: string) => {
    await deletePack(id)
    toast.success(`“${name}” deleted`)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="brand">Brand Kit</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        {/* ---------------- Templates ---------------- */}
        <TabsContent value="templates" className="mt-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Certificate Templates</h1>
              <p className="mt-1 text-muted-foreground">Manage your designs for every recognition occasion.</p>
            </div>
            <Button className="font-semibold" onClick={newTemplate}>
              <Plus className="size-4" /> Create new template
            </Button>
          </div>

          {/* Filter bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={tplQuery}
                onChange={(e) => setTplQuery(e.target.value)}
                placeholder="Search templates by name or style…"
                className="pl-9"
              />
            </div>
            <Select value={tplTier} onValueChange={(value) => setTplTier(value as TemplateDef["tier"] | "all")}>
              <SelectTrigger className="w-[150px]">
                <Filter className="size-4" />
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                {TEMPLATE_TIERS.map((tier) => (
                  <SelectItem key={tier.key} value={tier.key}>{tier.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tplStyle} onValueChange={(value) => setTplStyle(value as TemplateDef["style"] | "all")}>
              <SelectTrigger className="w-[160px]">
                <Palette className="size-4" />
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All styles</SelectItem>
                {TEMPLATE_STYLES.map((style) => (
                  <SelectItem key={style.key} value={style.key}>{style.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast("Sorted by recently used")}>
              <ArrowUpDown className="size-4" /> Sort: Recently used
            </Button>
          </div>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTemplates.map((t) => {
              const active = h.template === t.key
              const status = active ? "In use" : t.bestFor.includes(h.vertical) ? "Recommended" : t.tier
              return (
                <div key={t.key} className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg">
                  <div className="relative border-b bg-muted/40 p-4">
                    <div className="overflow-hidden rounded-lg ring-1 ring-border">
                      <Certificate fields={{ ...fields, template: t.key }} recipient={h.recipients[0]} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="sm" onClick={() => applyTemplate(t)} className="shadow-sm">
                        {active ? "Selected" : "Use template"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{t.name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`rounded-full px-2 py-0.5 ${active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{status}</span>
                          <span>· {t.blurb}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{t.tier}</Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{t.style}</Badge>
                          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                            <span className="size-2 rounded-full" style={{ background: t.defaultAccent }} /> Engine accent
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => applyTemplate(t)}>
                        {active ? <Check className="size-4" /> : null} {active ? "Selected" : "Use template"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Duplicate"
                        onClick={() => {
                          applyTemplate(t)
                          toast.success(`“${t.name}” duplicated`, { description: "Opened in Create to customise." })
                          navigate("/create")
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Create new */}
            <button onClick={newTemplate} className="group flex min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition hover:border-primary/40 hover:bg-accent/40">
              <span className="grid size-16 place-items-center rounded-full bg-muted transition-transform group-hover:scale-110">
                <Plus className="size-8 text-primary" />
              </span>
              <span className="mt-4 font-semibold">Create new template</span>
              <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">Start from scratch or use AI to generate a unique design.</p>
            </button>
          </div>
        </TabsContent>

        {/* ---------------- Awards (collections + packs) ---------------- */}
        <TabsContent value="awards" className="mt-6">
          <div className="mb-5">
            <h1 className="text-3xl font-semibold tracking-tight">Award Templates</h1>
            <p className="mt-1 text-muted-foreground">Ready-made award designs — preview live, then start a recognition in one click.</p>
          </div>

          {/* Sector filter chips */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSector("all")}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${sector === "all" ? "border-primary bg-accent text-accent-foreground" : "bg-card"}`}
            >
              All
            </button>
            {VERTICAL_LIST.map((v) => (
              <button
                key={v.key}
                onClick={() => setSector(v.key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${sector === v.key ? "border-primary bg-accent text-accent-foreground" : "bg-card"}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Award template gallery — each award rendered as a live certificate */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sectorsForFilter
              .flatMap((s) => COLLECTIONS[s].map((a) => ({ ...a, sectorLabel: VERTICALS[s].label })))
              .map((a, i) => (
                <div
                  key={`${a.name}-${i}`}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
                >
                  <div className="relative border-b bg-muted/40 p-3">
                    <div className="overflow-hidden rounded-md ring-1 ring-border">
                      <Certificate fields={{ ...fields, award: a.name }} recipient={h.recipients[0]} />
                    </div>
                    <span className="absolute left-5 top-5 grid size-8 place-items-center rounded-full bg-card text-base shadow-soft">
                      {a.icon}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="sm" className="shadow-sm" onClick={() => startAward(a.name)}>
                        Use award <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <button onClick={() => startAward(a.name)} className="flex items-center justify-between gap-2 p-3 text-left">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <p className="text-[11px] text-muted-foreground">{a.sectorLabel} award</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                </div>
              ))}
          </div>

          {/* Recognition Packs */}
          <div className="mt-10 mb-4 flex flex-wrap items-center gap-2">
            <Package className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Recognition Packs</h2>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">one click, whole event</Badge>
            <Button variant="outline" size="sm" className="ml-auto" onClick={openCreatePack}>
              <Plus className="size-4" /> Create pack
            </Button>
          </div>
          {packsLoading ? (
            <div className="grid place-items-center rounded-xl border border-dashed py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visiblePacks.map((p) => {
                const certs = p.items.filter((i) => i.kind === "certificate").length
                const extras = p.items.length - certs
                const firstCert = p.items.find((i) => i.kind === "certificate")?.label ?? p.items[0]?.label ?? p.name
                return (
                  <div key={p.key} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-soft-lg">
                    <div className="flex items-start justify-between">
                      <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                        <Package className="size-5" />
                      </span>
                      <div className="flex items-center gap-2">
                        {!p.builtIn && (
                          <Badge variant="secondary" className="bg-success/10 text-success">Custom</Badge>
                        )}
                        <span className="text-xs font-medium text-muted-foreground">{certs} certs · {extras} extras</span>
                      </div>
                    </div>
                    <h3 className="mt-3 font-semibold">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.items.map((it) => (
                        <span key={it.label} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {it.label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button className="flex-1" onClick={() => startPack(p.key, firstCert)}>
                        Use pack <ArrowRight className="size-4" />
                      </Button>
                      {!p.builtIn && p.id && (
                        <Button variant="outline" size="icon" aria-label="Delete pack" onClick={() => removePack(p.id!, p.name)}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <CreatePackSheet
            open={packSheetOpen}
            onOpenChange={setPackSheetOpen}
            defaultSector={sector === "all" ? h.vertical : sector}
            createPack={createPack}
          />
        </TabsContent>

        {/* ---------------- Brand Kit ---------------- */}
        <TabsContent value="brand" className="mt-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Brand Kit</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">
                Set the default look for {h.org}. New certificates inherit this template, accent and logo automatically.
              </p>
            </div>
            <Button onClick={() => navigate("/create")}>
              <ArrowRight className="size-4" /> Create with this brand
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <section className="col-span-12 rounded-xl border bg-card p-5 shadow-sm xl:col-span-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h3 className="text-xl font-semibold">Brand presets</h3>
              </div>
              <div className="grid gap-3">
                {brandPresets.map((preset) => {
                  const active = h.template === preset.template && h.accent.toLowerCase() === preset.accent.toLowerCase()
                  return (
                    <button
                      key={preset.key}
                      onClick={() => applyBrandPreset(preset)}
                      className={`rounded-lg border p-3 text-left transition hover:border-primary/40 hover:bg-accent/30 ${active ? "border-primary bg-accent/40 ring-1 ring-primary" : "bg-background"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{preset.name}</p>
                          <p className="text-sm text-muted-foreground">{preset.blurb}</p>
                        </div>
                        <span className="mt-1 size-4 rounded-full border" style={{ background: preset.accent }} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline">{getTemplate(preset.template).name}</Badge>
                        <Badge variant="outline" className="capitalize">{getTemplate(preset.template).style}</Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 rounded-lg border border-primary/15 bg-accent/30 p-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{activeVertical.label} recommendation:</span> {suggestedTemplates.map((t) => t.name).slice(0, 3).join(", ")}
              </div>
            </section>

            <section className="col-span-12 rounded-xl border bg-card p-5 shadow-sm xl:col-span-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Image className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold">Live brand preview</h3>
                </div>
                <Badge variant="outline" className="capitalize">{currentTemplate.tier} · {currentTemplate.style}</Badge>
              </div>
              <div className="overflow-hidden rounded-lg border bg-muted/30 p-4">
                <Certificate fields={fields} recipient={h.recipients[0]} />
              </div>
            </section>

            <section className="col-span-12 rounded-xl border bg-card p-5 shadow-sm lg:col-span-7">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="size-5 text-primary" />
                <h3 className="text-xl font-semibold">Certificate defaults</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Organisation name</Label>
                  <Input value={h.org} onChange={(e) => h.setField("org", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Default signatory</Label>
                  <Input value={h.signatory} onChange={(e) => h.setField("signatory", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Default award title</Label>
                  <Input value={h.award} onChange={(e) => h.setField("award", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Preferred template</Label>
                  <Select value={h.template} onValueChange={(key) => applyTemplate(getTemplate(key))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Default certificate accent</p>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.hex}
                      title={a.name}
                      onClick={() => h.setAccent(a.hex)}
                      className={`size-8 rounded-full border ${h.accent === a.hex ? "ring-2 ring-foreground ring-offset-2" : ""}`}
                      style={{ background: a.hex }}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="col-span-12 rounded-xl border bg-card p-5 shadow-sm lg:col-span-5">
              <div className="mb-4 flex items-center gap-2">
                <Upload className="size-5 text-primary" />
                <h3 className="text-xl font-semibold">Logo asset</h3>
              </div>
              <label className="flex h-52 cursor-pointer items-center justify-center rounded-lg border border-dashed bg-background p-6 transition-colors hover:border-primary">
                {h.logo ? (
                  <img src={h.logo} alt="Organisation logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="size-6" /> Upload organisation logo
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const r = new FileReader()
                    r.onload = () => h.setLogo(String(r.result))
                    r.readAsDataURL(f)
                  }}
                />
              </label>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Logo is saved with the organisation brand defaults.</p>
                {h.logo && (
                  <button className="text-sm text-destructive hover:underline" onClick={() => h.setLogo(null)}>
                    Remove logo
                  </button>
                )}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ---------------- Assets ---------------- */}
        <TabsContent value="assets" className="mt-6">
          <EmptyState
            icon={Image}
            title="No custom assets yet"
            body="Upload logos, signatures and backgrounds to reuse across recognitions."
            cta="Upload a logo in Brand Kit"
            onCta={() => toast("Add assets in Brand Kit", { description: "Your logo lives under the Brand Kit tab — more asset types are coming." })}
          />
        </TabsContent>

        {/* ---------------- Marketplace ---------------- */}
        <TabsContent value="marketplace" className="mt-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">Sellable recognition packs with certificates, event assets and ready-to-use wording.</p>
            </div>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              Packs buyers can understand
            </Badge>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {PREMIUM_COLLECTIONS.map((c) => (
              <div key={c.key} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                      <ShoppingBag className="size-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{c.name}</h3>
                        <Badge variant="outline">{c.includedIn}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-extrabold">{c.price}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {c.bestFor.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground">{tag}</Badge>
                  ))}
                </div>

                <div className="mt-4 rounded-lg border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Included items</p>
                    <span className="text-xs text-muted-foreground">{c.items.length} deliverables · {c.count} designs/assets</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {c.items.map((item) => (
                      <div key={`${c.key}-${item.kind}-${item.label}`} className="flex items-center gap-2 rounded-md bg-card px-2.5 py-2 text-sm">
                        <span className="grid size-6 shrink-0 place-items-center rounded bg-accent/60 text-[11px] font-bold uppercase text-primary">
                          {item.kind.slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    {c.sectors.map((sectorKey) => (
                      <Badge key={sectorKey} variant="outline" className="capitalize">{VERTICALS[sectorKey].label}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast(`${c.name}`, { description: c.items.map((item) => item.label).slice(0, 4).join(" · ") })}>
                      Preview
                    </Button>
                    <Button onClick={() => toast.success(`${c.name}`, { description: "Checkout and unlock flow can connect here." })}>
                      {c.price === "£99" ? "Book setup" : "Unlock pack"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const PACK_EXTRAS: { label: string; kind: OutputKind }[] = [
  { label: "Medal Badge", kind: "badge" },
  { label: "Social Media Graphic", kind: "social" },
  { label: "Printable Award Card", kind: "card" },
  { label: "Event Banner", kind: "banner" },
]

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-primary bg-accent font-semibold text-accent-foreground" : "bg-card hover:border-primary/40"}`}
    >
      {children}
    </button>
  )
}

function CreatePackSheet({
  open,
  onOpenChange,
  defaultSector,
  createPack,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultSector: VerticalKey
  createPack: (input: NewPack) => Promise<unknown>
}) {
  const [name, setName] = useState("")
  const [sector, setSector] = useState<VerticalKey>(defaultSector)
  const [blurb, setBlurb] = useState("")
  const [certs, setCerts] = useState<string[]>([])
  const [extras, setExtras] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName("")
    setSector(defaultSector)
    setBlurb("")
    setCerts([])
    setExtras([])
  }

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const onSector = (v: VerticalKey) => {
    setSector(v)
    setCerts([]) // award lists differ per sector
  }

  const canSave = name.trim().length > 0 && certs.length + extras.length > 0

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    const items: PackItem[] = [
      ...certs.map((label) => ({ label, kind: "certificate" as OutputKind })),
      ...extras.map((label) => ({ label, kind: PACK_EXTRAS.find((e) => e.label === label)!.kind })),
    ]
    const created = await createPack({ name: name.trim(), sectors: [sector], blurb: blurb.trim(), items })
    setSaving(false)
    if (created) {
      toast.success(`“${name.trim()}” pack created`, { description: `${items.length} items saved to your organisation.` })
      reset()
      onOpenChange(false)
    } else {
      toast.error("Couldn't create the pack")
    }
  }

  const awards = COLLECTIONS[sector] ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create Recognition Pack</SheetTitle>
          <SheetDescription>A named family of certificates and extras in one consistent style — usable in one click from Create.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 py-5">
          <div className="grid gap-1.5">
            <Label>Pack name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="End of Year Pack" />
          </div>
          <div className="grid gap-1.5">
            <Label>Workspace</Label>
            <Select value={sector} onValueChange={(v) => onSector(v as VerticalKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VERTICAL_LIST.map((v) => (
                  <SelectItem key={v.key} value={v.key}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Everything for the end-of-year celebration." rows={2} />
          </div>

          <div className="grid gap-2">
            <Label>Certificates ({certs.length})</Label>
            <div className="flex flex-wrap gap-2">
              {awards.map((a) => (
                <Chip key={a.name} on={certs.includes(a.name)} onClick={() => toggle(certs, setCerts, a.name)}>
                  {a.icon} {a.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Extras ({extras.length})</Label>
            <div className="flex flex-wrap gap-2">
              {PACK_EXTRAS.map((e) => (
                <Chip key={e.label} on={extras.includes(e.label)} onClick={() => toggle(extras, setExtras, e.label)}>
                  {e.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-auto flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save} disabled={!canSave || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Create pack
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
