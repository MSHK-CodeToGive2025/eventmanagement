import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BarChartProps {
  data: any[]
  title: string
  description?: string
  height?: number
}

export function BarChart({ data, title, description, height = 350 }: BarChartProps) {
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

        const labels = data.map((item) => item.eventName || item.formName || item.name)
        const primaryValues = data.map((item) => item.views)
        const secondaryValues = data.map((item) => item.registrations || item.completions || item.conversions)

        chart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Views",
                data: primaryValues,
                backgroundColor: "rgba(234, 179, 8, 0.8)",
                borderColor: "rgb(234, 179, 8)",
                borderWidth: 1,
              },
              {
                label:
                  secondaryValues === data.map((item) => item.registrations)
                    ? "Registrations"
                    : secondaryValues === data.map((item) => item.completions)
                      ? "Completions"
                      : "Conversions",
                data: secondaryValues,
                backgroundColor: "rgba(59, 130, 246, 0.8)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 1,
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
