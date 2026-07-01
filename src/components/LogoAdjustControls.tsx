import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export interface LogoAdjustValue {
  logoScale: number
  logoX: number
  logoY: number
}

interface LogoAdjustControlsProps {
  value: LogoAdjustValue
  onChange: (patch: Partial<LogoAdjustValue>) => void
}

export function LogoAdjustControls({ value, onChange }: LogoAdjustControlsProps) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Logo position</Label>
        <Button variant="outline" size="sm" onClick={() => onChange({ logoScale: 100, logoX: 0, logoY: 0 })}>
          Reset
        </Button>
      </div>

      <div className="grid gap-3">
        <LogoRange label="Size" value={value.logoScale} min={60} max={180} suffix="%" onChange={(logoScale) => onChange({ logoScale })} />
        <LogoRange label="Horizontal" value={value.logoX} min={-24} max={24} onChange={(logoX) => onChange({ logoX })} />
        <LogoRange label="Vertical" value={value.logoY} min={-12} max={18} onChange={(logoY) => onChange({ logoY })} />
      </div>
    </div>
  )
}

function LogoRange({
  label,
  value,
  min,
  max,
  suffix = "",
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  )
}
