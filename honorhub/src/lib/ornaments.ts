// Certificate ornaments — ported from the HonorHub prototype.
// Each ORN entry is an inline SVG that inherits the accent via currentColor.

export function star(cx: number, cy: number, r: number): string {
  let p = ""
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rad = i % 2 ? r * 0.42 : r
    p += (i ? "L" : "M") + (cx + Math.cos(a) * rad).toFixed(1) + " " + (cy + Math.sin(a) * rad).toFixed(1) + " "
  }
  return `<path d="${p}Z"/>`
}

export function seal(): string {
  return `
  <svg class="cert-seal" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="34" fill="var(--accent)" opacity=".12"/>
    <circle cx="50" cy="50" r="34" fill="none" stroke="var(--accent)" stroke-width="1.4"/>
    <circle cx="50" cy="50" r="27" fill="none" stroke="var(--accent)" stroke-width=".7" opacity=".6"/>
    <g fill="var(--accent)">${star(50, 49, 15)}</g>
    <path d="M38 78 l-7 16 9 -4 5 8 6 -16Z M62 78 l7 16 -9 -4 -5 8 -6 -16Z" fill="var(--accent)" opacity=".85"/>
  </svg>`
}

/* ---- Luxury ornament parts ---- */

/** A baroque corner flourish (curling acanthus scrolls). */
function flourish(transform: string): string {
  return `<g transform="${transform}" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".75">
    <path d="M2 78 C 2 34 34 2 78 2"/>
    <path d="M2 64 C 2 40 28 18 60 16"/>
    <path d="M16 58 q 20 -3 33 8 q -7 -21 -28 -27 q 22 -2 36 11"/>
    <path d="M2 78 q 26 4 40 -8"/>
    <circle cx="78" cy="2" r="2.4" fill="currentColor" stroke="none"/>
  </g>`
}

/** The four corner flourishes, mirrored into place. */
function corners(): string {
  return (
    flourish("translate(28,28)") +
    flourish("translate(572,28) scale(-1,1)") +
    flourish("translate(28,396) scale(1,-1)") +
    flourish("translate(572,396) scale(-1,-1)")
  )
}

/** A small centred crest / coronet above the body. */
function crest(): string {
  return `<g transform="translate(300,30)" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8">
    <path d="M0 6 V 30"/>
    <path d="M-24 18 q 24 -17 48 0"/>
    <path d="M-36 27 q 36 -23 72 0"/>
    <path d="M-12 35 q 12 9 24 0"/>
    <g fill="currentColor" stroke="none">${star(0, 3, 5.5)}${star(-24, 17, 2.6)}${star(24, 17, 2.6)}</g>
  </g>`
}

const luxeOrn = (extra = "") => `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      ${corners()}
      ${crest()}
      ${extra}
    </svg>`

export const ORN: Record<string, string> = {
  imperial: luxeOrn(`<g fill="currentColor" opacity=".5">${[[120, 46], [480, 46], [70, 250], [530, 250]].map(([x, y]) => star(x, y, 3.4)).join("")}</g>`),
  opulent: luxeOrn(`<g stroke="currentColor" stroke-width=".8" opacity=".4" fill="none" stroke-linecap="round">
        <path d="M170 64 q 130 -34 260 0"/>
        <path d="M170 360 q 130 34 260 0"/>
      </g>`),
  onyx: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1" opacity=".55" stroke-linecap="round">
        <path d="M40 40 h34 M40 40 v34 M560 40 h-34 M560 40 v34 M40 384 h34 M40 384 v-34 M560 384 h-34 M560 384 v-34"/>
      </g>
      <g transform="translate(300,40)" fill="currentColor" opacity=".7">${star(0, 0, 4.5)}</g>
    </svg>`,
  emerald: luxeOrn(),
  burgundy: luxeOrn(),
  laurel: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1.4" opacity=".7" fill="none" stroke-linecap="round">
        <path d="M300 36 C 286 50, 282 66, 286 82 M300 36 C 314 50, 318 66, 314 82"/>
        <path d="M292 52 q -10 -2 -16 4 M308 52 q 10 -2 16 4 M289 68 q -12 0 -18 7 M311 68 q 12 0 18 7"/>
      </g>
      <g stroke="currentColor" stroke-width="1" opacity=".5" fill="none">
        <path d="M40 40 h26 M40 40 v26 M560 40 h-26 M560 40 v26 M40 384 h26 M40 384 v-26 M560 384 h-26 M560 384 v-26"/>
      </g>
    </svg>`,
  sunbeam: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1.1" opacity=".22">
        ${Array.from({ length: 18 })
          .map((_, i) => {
            const a = (i / 18) * Math.PI * 2
            const x = 300 + Math.cos(a) * 70,
              y = 90 + Math.sin(a) * 70,
              x2 = 300 + Math.cos(a) * 120,
              y2 = 90 + Math.sin(a) * 120
            return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`
          })
          .join("")}
      </g>
      <g fill="currentColor" opacity=".5">
        ${[[70, 300], [535, 300], [110, 360], [500, 355], [300, 388]].map(([x, y]) => star(x, y, 7)).join("")}
      </g>
    </svg>`,
  meadow: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1.3" opacity=".6" fill="none" stroke-linecap="round">
        <path d="M70 70 q 38 -30 70 -8 q -34 8 -70 8 q 30 14 64 4 q -28 16 -64 -4Z" transform="translate(-30,-30)"/>
        <path d="M530 354 q -38 30 -70 8 q 34 -8 70 -8 q -30 -14 -64 -4 q 28 -16 64 4Z" transform="translate(30,30)"/>
      </g>
    </svg>`,
  regal: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      ${[["translate(26,26)"], ["translate(574,26) scale(-1,1)"], ["translate(26,398) scale(1,-1)"], ["translate(574,398) scale(-1,-1)"]]
        .map(
          ([t]) =>
            `<g transform="${t}" stroke="currentColor" stroke-width="1.3" opacity=".7" fill="none" stroke-linecap="round">
          <path d="M0 42 C 0 16 16 0 42 0"/>
          <path d="M9 31 q 12 14 30 16 q -7 -19 -25 -25 q 18 -1 31 9"/>
        </g>`
        )
        .join("")}
      <g transform="translate(300,30)" stroke="currentColor" stroke-width="1.2" opacity=".6" fill="none" stroke-linecap="round">
        <path d="M0 -2 V 20 M-17 9 q17 -13 34 0 M-27 17 q27 -17 54 0"/>
      </g>
      <g fill="currentColor" opacity=".55">${star(300, 8, 5)}</g>
    </svg>`,
  confetti: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g fill="currentColor">
        ${[[60, 72, 0.62], [124, 42, 0.4], [300, 34, 0.5], [500, 58, 0.58], [548, 112, 0.4], [40, 206, 0.42], [566, 212, 0.5], [72, 330, 0.5], [152, 382, 0.38], [470, 360, 0.58], [540, 332, 0.44]]
          .map(([x, y, o], i) =>
            i % 3 === 0
              ? `<circle cx="${x}" cy="${y}" r="4.2" opacity="${o}"/>`
              : i % 3 === 1
                ? `<g opacity="${o}">${star(x, y, 7)}</g>`
                : `<rect x="${x - 3.2}" y="${y - 3.2}" width="6.4" height="6.4" rx="1.5" opacity="${o}" transform="rotate(22 ${x} ${y})"/>`
          )
          .join("")}
      </g>
    </svg>`,
  botanical: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1.3" opacity=".6" fill="none" stroke-linecap="round">
        <path d="M300 26 q -30 16 -38 44 M300 26 q 30 16 38 44"/>
        ${[-1, 1]
          .map(
            (s) => `<g transform="translate(300,28) scale(${s},1)">
          ${[8, 20, 32].map((d) => `<path d="M-${4 + d * 0.5} ${16 + d} q -12 -7 -19 -2 q 9 5 19 2"/>`).join("")}
        </g>`
          )
          .join("")}
      </g>
      <g stroke="currentColor" stroke-width="1.1" opacity=".45" fill="none" stroke-linecap="round">
        <path d="M44 388 q 30 -12 44 -38 M88 350 q 9 14 1 27 M88 350 q 17 6 28 1"/>
        <path d="M556 388 q -30 -12 -44 -38 M512 350 q -9 14 -1 27 M512 350 q -17 6 -28 1"/>
      </g>
    </svg>`,
  midnight: `
    <svg class="cert-orn" viewBox="0 0 600 424" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <g fill="currentColor" opacity=".85">
        ${[[300, 40, 7], [262, 52, 4], [338, 52, 4], [228, 42, 3], [372, 42, 3]].map(([x, y, r]) => star(x, y, r)).join("")}
      </g>
      <g fill="currentColor" opacity=".4">
        ${[[58, 84], [82, 300], [522, 92], [542, 322], [120, 372], [482, 360], [300, 384]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7"/>`).join("")}
      </g>
      <g stroke="currentColor" stroke-width="1" opacity=".3" fill="none">
        <path d="M44 44 h22 M44 44 v22 M556 44 h-22 M556 44 v22 M44 380 h22 M44 380 v-22 M556 380 h-22 M556 380 v-22"/>
      </g>
    </svg>`,
}
