# HonorHub Content Model — Templates, Collections, Packs

### Extends PRD v1.1 §7. This is the "content depth = competitive advantage" spine.

Target for launch: **80–120 professionally designed templates**, organised into sector collections —
not a handful of generic certificates. Users should feel HonorHub understands their world.

## Three levels

**Level 1 — Quick Templates (MVP).** Universal styles that work for any organisation. Generate in seconds.

```
Modern · Classic · Elegant · Formal · Minimal · Premium
```

These map to the engine's visual templates. Current implementations and provisional mapping:

| Style (catalog) | Engine template | Status |
|---|---|---|
| Classic | laurel | ✅ built |
| Modern | meadow | ✅ built |
| Elegant | botanical | ✅ built |
| Formal | regal | ✅ built |
| Premium | midnight | ✅ built |
| Minimal | — | ⚠️ needs a dedicated clean design |

> Reconciliation note: the engine also has `sunbeam` (warm, younger years) and `confetti` (playful) —
> useful as *sector* flavours (schools/early years) rather than Level-1 universal styles. We likely
> need 1 new design (a true **Minimal**) to complete Level 1.

**Level 2 — Sector Collections.** Named award collections per sector, each available in several visual
styles. This is where HonorHub stands out. Sector motif guidance:

- **Churches** — warm, elegant; subtle cross / dove / olive-branch motifs, not generic borders.
- **Football & Sports** — energetic visual language.
- **Corporate** — executive, premium.
- **Schools** — bright, encouraging (sunbeam/confetti flavours fit here).

Full award lists per sector are encoded in `honorhub/src/lib/catalog.ts` (Schools ~15, Churches ~15,
Sports ~10, Corporate ~10, Charities ~7).

**Level 3 — Premium Collections (Marketplace / higher tiers).**

| Collection | Templates | Price |
|---|---|---|
| Education Collection | 50 | £29 |
| Church Collection | 75 | £39 |
| Corporate Collection | 100 | £49 |

Sold à la carte or bundled into higher subscription tiers.

## Recognition Packs (Template Families)

One click → a visually-matched bundle for a whole event. Examples encoded in `catalog.ts`:

- **Sports Day Pack** — Winner, Runner-up, Participation, House Champion certificates + Medal Badge +
  Social Media Graphic + Printable Award Card.
- **Church Anniversary Pack** — Volunteer, Pastor Appreciation, Choir Recognition, Children's Ministry
  + Event Banner + Digital Thank-You Card.
- **Graduation Pack** — Certificate, Honour Roll, Parent Appreciation, Teacher Appreciation, Student
  Badge + Social Media Announcement.

All items in a pack share one consistent style. (Data model: PRD v1.1 §7 `recognition_packs` /
`pack_items`.)

## The Recognition Experience (multi-output)

After **Generate**, one recognition can produce *all* of:

```
✅ Printable Certificate (PDF)   ✅ Digital Certificate
✅ Social media image (IG / FB / LinkedIn)   ✅ Email version
✅ QR verification page   ✅ Printable award card   ✅ Digital badge
```

Few competitors offer this in a single workflow. (Builds on PRD v1.1 §4 output formats.)

## AI Template Recommendations (signature capability)

Select **Organisation = School**, **Event = Sports Day** → HonorHub suggests a **Recommended
Recognition Pack** (Sports Day Winner · Participation · House Champion · Team Spirit). The user picks
the pack and generates. Powered by the catalog + the `recognition_events` feed (PRD v1.1 §2).

## Build implications

- `catalog.ts` (frontend data) powers: visual award cards (PRD v1.1 §3), Library collections + sector
  filters (§5), pack picker, and AI recommendations.
- Level 2/3 + Packs + Marketplace need the backend models in PRD v1.1 §7 to become *saved* and
  *sellable*; the catalog can ship as seed data on the frontend first.
- Outstanding design work: a **Minimal** template, plus per-sector motif variants (church dove/olive,
  sports energetic, corporate executive) layered over the existing engine.
