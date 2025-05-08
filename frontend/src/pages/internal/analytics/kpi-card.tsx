import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  change?: number
  trend?: "up" | "down" | "neutral"
}

export function KpiCard({ title, value, description, icon, change, trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || change !== undefined) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            {trend && (
              <span
                className={cn(
                  "mr-1 flex items-center",
                  trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "",
                )}
              >
                {trend === "up" ? (
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                ) : trend === "down" ? (
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                ) : null}
                {change !== undefined && `${change}%`}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
