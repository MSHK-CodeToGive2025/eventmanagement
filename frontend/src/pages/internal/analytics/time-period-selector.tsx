import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TimePeriodSelectorProps {
  periods: { label: string; value: string }[]
  activePeriod: string
  onChange: (period: string) => void
}

export function TimePeriodSelector({ periods, activePeriod, onChange }: TimePeriodSelectorProps) {
  return (
    <div className="flex space-x-1 rounded-md border p-1">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(period.value)}
          className={cn("rounded-sm", activePeriod === period.value && "bg-muted font-medium")}
        >
          {period.label}
        </Button>
      ))}
    </div>
  )
}
