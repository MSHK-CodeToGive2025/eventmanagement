import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PageView } from "@/types/analytics-data"

interface LineChartProps {
  data: PageView[]
  title: string
  description?: string
  height?: number
}

export function LineChart({ data, title, description, height = 350 }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [chartKey, setChartKey] = useState(Date.now())

  useEffect(() => {
    // Force re-render of canvas with a new key when data changes
    setChartKey(Date.now())
  }, [data])

  useEffect(() => {
    let chart: any = null

    const initializeChart = async () => {
      if (!canvasRef.current) return

      try {
        const { Chart, registerables } = await import("chart.js")
        Chart.register(...registerables)

        // Make sure any global chart instances are cleared
        Chart.getChart(canvasRef.current)?.destroy()

        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return

        const dates = data.map((item) => item.date)
        const views = data.map((item) => item.views)
        const visitors = data.map((item) => item.uniqueVisitors)

        chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: dates,
            datasets: [
              {
                label: "Page Views",
                data: views,
                borderColor: "rgb(234, 179, 8)",
                backgroundColor: "rgba(234, 179, 8, 0.1)",
                borderWidth: 2,
                tension: 0.3,
                fill: true,
              },
              {
                label: "Unique Visitors",
                data: visitors,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderWidth: 2,
                tension: 0.3,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(0, 0, 0, 0.05)",
                },
              },
            },
            interaction: {
              mode: "nearest",
              axis: "x",
              intersect: false,
            },
          },
        })
      } catch (error) {
        console.error("Error initializing chart:", error)
      }
    }

    // Small timeout to ensure DOM is ready and previous chart is fully destroyed
    const timer = setTimeout(() => {
      initializeChart()
    }, 50)

    return () => {
      clearTimeout(timer)
      if (chart) {
        chart.destroy()
      }
    }
  }, [chartKey, data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px`, position: "relative" }}>
          <canvas key={chartKey} ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  )
}
