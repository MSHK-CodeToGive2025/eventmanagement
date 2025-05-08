import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PieChartProps {
  data: any[]
  title: string
  description?: string
  height?: number
  type?: "pie" | "doughnut"
}

export function PieChart({ data, title, description, height = 300, type = "pie" }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [chartKey, setChartKey] = useState(Date.now())

  useEffect(() => {
    // Force re-render of canvas with a new key when data or type changes
    setChartKey(Date.now())
  }, [data, type])

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

        // Generate colors for the chart
        const colors = [
          "rgba(234, 179, 8, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(249, 115, 22, 0.8)",
          "rgba(236, 72, 153, 0.8)",
        ]

        const labels = data.map((item) => item.country || item.device || item.source)
        const values = data.map((item) => item.users || item.percentage || item.sessions)

        chart = new Chart(ctx, {
          type: type,
          data: {
            labels: labels,
            datasets: [
              {
                data: values,
                backgroundColor: colors.slice(0, data.length),
                borderColor: "white",
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                labels: {
                  boxWidth: 15,
                  padding: 15,
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || ""
                    const value = context.raw
                    const percentage = data[context.dataIndex].percentage
                      ? data[context.dataIndex].percentage
                      : ((value as number) / values.reduce((a, b) => a + (b as number), 0)) * 100
                    return `${label}: ${value} (${percentage.toFixed(1)}%)`
                  },
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
  }, [chartKey, data, type])

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
