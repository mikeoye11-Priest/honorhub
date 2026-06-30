import { useEffect, useRef } from "react"
import { getReduceMotion } from "@/lib/theme"

const COLORS = ["#f58220", "#6A4A3C", "#22C55E", "#2563EB", "#F59E0B"]

/** Lightweight celebratory confetti — runs for a few seconds then clears.
 *  Ported from the Stitch success screen. Respects prefers-reduced-motion. */
export function Confetti({ duration = 6000 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || getReduceMotion()
    const cv = ref.current
    if (!cv || reduce) return
    const ctx = cv.getContext("2d")
    if (!ctx) return

    let raf = 0
    let stopped = false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      cv.width = cv.offsetWidth * dpr
      cv.height = cv.offsetHeight * dpr
    }
    resize()
    window.addEventListener("resize", resize)

    const spawn = () => ({
      x: Math.random() * cv.width,
      y: -10,
      size: (Math.random() * 8 + 4) * dpr,
      speedY: (Math.random() * 3 + 2) * dpr,
      speedX: (Math.random() - 0.5) * 4 * dpr,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * 360,
      rotSpeed: Math.random() * 10 - 5,
    })
    const particles = Array.from({ length: 90 }, spawn)

    const frame = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      for (const p of particles) {
        p.y += p.speedY
        p.x += p.speedX
        p.rot += p.rotSpeed
        if (p.y > cv.height) {
          p.y = -10
          p.x = Math.random() * cv.width
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      }
      if (!stopped) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const timer = window.setTimeout(() => {
      stopped = true
      cancelAnimationFrame(raf)
      ctx.clearRect(0, 0, cv.width, cv.height)
    }, duration)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      window.removeEventListener("resize", resize)
    }
  }, [duration])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-10 size-full" aria-hidden />
}
