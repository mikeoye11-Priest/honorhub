# HonorHub PRD v1.1 — Design Feedback → Product Definition

### Zequence Digital Ltd · supersedes nothing; extends Design Bible v1.0 + `product-architecture.md`

This document turns the v1.0 design review into committed product scope. It exists because the
**UI is currently ahead of the product definition** — these features were validated in the React
prototype and now need their data models and backend implications written down before implementation.

Each item is tagged:

- **[FE-NOW]** — pure frontend; safe to build against current session-only state, no schema change.
- **[BE-REQ]** — needs backend data model / API; spec first, build after this PRD is agreed.

---

## 1. Organisation Switcher (was: Workspace Switcher) — **[BE-REQ]**

**Decision.** The sidebar switcher selects a real **organisation**, not just a vertical label.

```
🏫 Oakfield Primary School        ▼
   Switch to
   ⛪ Grace Community Church
   🏢 Zequence Digital
   + Add organisation
```

Same software, different terminology — driven by each organisation's `vertical`. This is a headline
commercial differentiator (one account → many organisations across sectors).

**Data model.**

```
accounts (id, name, plan, …)
organisations (id, account_id, name, vertical, logo_url, …)
organisation_memberships (id, organisation_id, user_id, role)
```

- `vertical ∈ {school, church, sports, company, charity, event}` drives terminology, default
  award/message, categories, AI tone, signatory labels, **group labels** (see §6).
- The active organisation is the tenant scope for everything below. Row-level security keys on
  `account_id` + `organisation_id`.

**Acceptance.** Switching organisation re-themes terminology and reloads that org's branding,
signatories, categories and groups — without a full page reload.

**Interim [FE-NOW].** Keep the current vertical switcher, but relabel options to
`<emoji> <Organisation name>` and seed 2–3 demo organisations in local state so the interaction is real.

---

## 2. Dashboard: "Recognition Opportunities" widget — **[BE-REQ for data, FE-NOW for widget]**

**Decision.** Make HonorHub *proactive*. A dashboard widget surfaces upcoming moments worth
recognising, each with a one-click **Generate →** that deep-links into the Create wizard pre-seeded
with award + category.

```
Recognition Opportunities
─────────────────────────
⚽ Sports Day        Tomorrow    Generate →
🗓 Attendance Awards Friday      Generate →
❤️ Volunteer Sunday  Next week   Generate →
```

**Data model.**

```
recognition_events (id, organisation_id, title, category, suggested_award,
                    date, source)  -- source: calendar | template | suggested
```

- Per-vertical seed sets (school term calendar, church calendar, sports fixtures, corporate cycles).
- AI may later *suggest* opportunities from activity patterns.

**Interim [FE-NOW].** Ship the widget now with per-vertical hard-coded opportunities; wire
**Generate →** to `/create` with the award pre-filled.

---

## 3. Create Step 1: visual Award cards — **[FE-NOW]**

**Decision.** Replace the text category buttons with icon-led cards (Canva-style). Less text, more visual.

```
🏆 Star of the Week   📚 Reading   ⚽ Sports   ❤️ Kindness   🗓 Attendance   🎓 Graduation
```

Each category in `VERTICALS[v].categories` gains an `icon` and short label. Selecting a card sets the
award title. No backend change.

---

## 4. Output formats (was: certificate only) — **[BE-REQ for badge/social assets, FE-NOW for layout toggle]**

**Decision.** One recognition → multiple outputs. Preview gains a format switcher:

```
Certificate (landscape) · Certificate (portrait) · Badge · Social Card
```

Same recognition data, different rendered artifact — a major selling point (print *and* shareable).

**Model implications.** A recognition's output set is defined by its **Recognition Pack** (§7). Each
output is a `render target` with its own aspect ratio + layout:

```
output_formats: certificate_landscape (297×210) | certificate_portrait (210×297)
              | badge (1:1 seal/rosette) | social_card (1200×630)
```

**Interim [FE-NOW].** Implement `certificate_landscape`, `certificate_portrait` and `badge` as CSS
layout variants of the existing container-query certificate (the engine already scales). `social_card`
can follow. Add a segmented control above the live preview.

---

## 5. Library: sector filters — **[FE-NOW]**

**Decision.** The shared template/pack library serves every sector; add filter chips:

```
All · School · Church · Corporate · Football · Charity · Events
```

Each template/pack carries `sectors: VerticalKey[]`. Filtering is client-side over that metadata.

---

## 6. Organisation: Groups module — **[BE-REQ]**

**Decision.** Add **Groups** between Roles and Signatories. Terminology auto-adapts to the vertical:

| Vertical | "Groups" means |
|---|---|
| School | Year 3, Year 4, Class 3H |
| Church | Choir, Youth, Volunteers |
| Company | Finance, Sales |
| Sports | U10, U12 |

**Data model.**

```
groups (id, organisation_id, name, kind)   -- kind label resolved from org.vertical
group_members (id, group_id, recipient_ref) -- recipient_ref is session-only unless Directory enabled
```

- Groups let a user recognise a whole class/team/department in one action.
- Respects privacy: members are session-only unless the org opts into the Recipient Directory.

**Nav.** Organisation tabs become: Users · Roles · **Groups** · Signatories · Privacy.

---

## 7. Recognition Packs (was: Templates) — **THE COMMERCIAL DIFFERENTIATOR** — **[BE-REQ]**

**Decision.** Stop selling "templates." Sell **Recognition Packs** — curated bundles that make a whole
event one click.

```
Sports Day Pack
  ├─ 8 certificate designs
  ├─ 4 badges
  ├─ Participation award (default message + template)
  ├─ Winner award (default message + template)
  ├─ Default signatory mapping
  └─ Brand mapping (uses org Brand Kit)
```

**Data model.**

```
recognition_packs (id, name, sectors[], cover_url, price, is_marketplace)
pack_items (id, pack_id, kind, template_key, output_format,
            default_award, default_message, signatory_role, sort)
            -- kind: certificate | badge | award | social_card
template_categories (id, key, label, sectors[])
pack_brand_bindings (pack_id, uses_org_brand_kit boolean, accent_override)
```

- A pack composes multiple **templates × output formats** with default messaging and signatory
  *roles* (resolved to the org's actual signatories at generation time).
- Packs are the unit of the **Marketplace** (free + paid), giving a recurring commercial surface.
- "Templates" remains the low-level primitive; **Packs** is the product-facing concept.

**Acceptance.** Selecting a pack in Create pre-populates award, message, template and output set;
Generate produces every artifact in the pack for every recipient.

---

## 8. Backend readiness summary

New/affected tables introduced by v1.1 (extends the list in `product-architecture.md`):

```
organisations.vertical                 (drives all terminology)
recognition_events                     (§2 dashboard opportunities)
groups, group_members                  (§6)
recognition_packs, pack_items          (§7)
template_categories, pack_brand_bindings (§7)
output_formats (enum)                  (§4)
```

Every org-owned row carries `account_id` + `organisation_id`; recipient data stays session-only unless
the org enables the Recipient Directory / Recognition Timeline (opt-in, per Design Bible).

---

## 9. Recommended build order

**Phase A — frontend now (no backend):**
1. Visual award cards (§3)
2. Library sector filter chips (§5)
3. Output-format toggle: landscape / portrait / badge (§4 interim)
4. Dashboard Recognition Opportunities widget with hard-coded per-vertical data (§2 interim)
5. Organisation switcher relabelled to organisation names with seeded demo orgs (§1 interim)
6. Groups tab in Organisation with per-vertical terminology, seeded data (§6 UI shell)

**Phase B — needs backend (spec → implement):**
7. Recognition Packs data model + Create integration (§7)
8. Real organisations / memberships / RLS (§1)
9. Recognition events feed (§2)
10. Groups persistence + Directory opt-in (§6)
11. Social Card output + Marketplace (§4, §7)

Phase A sharpens the prototype and de-risks the design. Phase B is gated on agreeing this PRD's
data models.
