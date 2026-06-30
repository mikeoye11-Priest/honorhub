// Recognition Packs data layer + hook.
// Built-in catalog packs (PACKS) merge with the org's own DB-saved packs.
// Demo mode (no backend / not signed in) → built-ins only, no create/delete.
import { useCallback, useEffect, useState } from "react"
import { supabase } from "./supabase"
import { useAuth } from "./auth"
import { PACKS, type RecognitionPack, type OutputKind, type PackItem } from "./catalog"
import type { VerticalKey } from "./honor"

const BUILTINS: RecognitionPack[] = PACKS.map((p) => ({ ...p, builtIn: true }))

interface PackRow {
  id: string
  name: string
  sectors: string[]
  blurb: string | null
  pack_items: { label: string; kind: OutputKind; sort: number }[] | null
}

function rowToPack(r: PackRow): RecognitionPack {
  const items: PackItem[] = (r.pack_items ?? [])
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((i) => ({ label: i.label, kind: i.kind }))
  return {
    key: r.id, // DB packs are keyed by their uuid
    id: r.id,
    name: r.name,
    sectors: (r.sectors ?? []) as VerticalKey[],
    blurb: r.blurb ?? "",
    items,
    builtIn: false,
  }
}

export interface NewPack {
  name: string
  sectors: VerticalKey[]
  blurb: string
  items: PackItem[]
}

/** Merged packs (built-ins + this org's saved packs) with create/delete. */
export function usePacks() {
  const { configured, activeOrgId } = useAuth()
  const live = configured && Boolean(activeOrgId)

  const [dbPacks, setDbPacks] = useState<RecognitionPack[]>([])
  const [loading, setLoading] = useState(live)

  const load = useCallback(async () => {
    if (!supabase || !activeOrgId) return
    setLoading(true)
    const { data } = await supabase
      .from("recognition_packs")
      .select("id, name, sectors, blurb, pack_items(label, kind, sort)")
      .eq("organisation_id", activeOrgId)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true })
    setDbPacks(((data ?? []) as PackRow[]).map(rowToPack))
    setLoading(false)
  }, [activeOrgId])

  useEffect(() => {
    if (!live) {
      setDbPacks([])
      setLoading(false)
      return
    }
    void load()
  }, [live, load])

  const createPack = useCallback(
    async (input: NewPack): Promise<RecognitionPack | null> => {
      if (!supabase || !activeOrgId) return null
      const { data: pack, error } = await supabase
        .from("recognition_packs")
        .insert({ organisation_id: activeOrgId, name: input.name, sectors: input.sectors, blurb: input.blurb })
        .select("id")
        .single()
      if (error || !pack) return null
      if (input.items.length) {
        await supabase
          .from("pack_items")
          .insert(input.items.map((it, i) => ({ pack_id: pack.id, label: it.label, kind: it.kind, sort: i })))
      }
      await load()
      return { key: pack.id, id: pack.id, name: input.name, sectors: input.sectors, blurb: input.blurb, items: input.items, builtIn: false }
    },
    [activeOrgId, load],
  )

  const deletePack = useCallback(
    async (id: string) => {
      if (!supabase) return
      setDbPacks((ps) => ps.filter((p) => p.id !== id))
      await supabase.from("recognition_packs").delete().eq("id", id)
    },
    [],
  )

  const packs = [...BUILTINS, ...dbPacks]
  const getPackByKey = (key: string | null | undefined) => (key ? packs.find((p) => p.key === key || p.id === key) : undefined)

  return { packs, dbPacks, loading, live, createPack, deletePack, getPackByKey, reload: load }
}
