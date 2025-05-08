import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart } from "@/pages/internal/analytics/charts/line-chart"
import { BarChart } from "@/pages/internal/analytics/charts/bar-chart"
import { PieChart } from "@/pages/internal/analytics/charts/pie-chart"
import { KpiCard } from "@/pages/internal/analytics/kpi-card"
import { DataTable } from "@/pages/internal/analytics/data-table"
import { DateRangePicker } from "@/pages/internal/analytics/date-range-picker"
import { TimePeriodSelector } from "@/pages/internal/analytics/time-period-selector"
import {
  trafficData,
  eventEngagementData,
  userAcquisitionData,
  formSubmissionData,
  deviceData,
  locationData,
  topContentData,
  getDataForTimePeriod,
  generateTimeSeriesData,
} from "@/types/analytics-data"
import {
  Users,
  Eye,
  Clock,
  ArrowRight,
  Calendar,
  FileText,
  BarChartIcon,
  PieChartIcon,
  LineChartIcon,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("traffic")
  const [timePeriod, setTimePeriod] = useState("month")
  const [trafficChartData, setTrafficChartData] = useState(trafficData)

  const timePeriods = [
    { label: "24h", value: "day" },
    { label: "7d", value: "week" },
    { label: "30d", value: "month" },
    { label: "1y", value: "year" },
  ]

  // Update chart data when time period changes
  useEffect(() => {
    if (timePeriod === "custom") return
    setTrafficChartData(getDataForTimePeriod(timePeriod as any))
  }, [timePeriod])

  // Handle custom date range selection
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setTimePeriod("custom")
    setTrafficChartData(generateTimeSeriesData(range.from, range.to))
  }

  // Calculate total views and visitors
  const totalViews = trafficChartData.reduce((sum, item) => sum + item.views, 0)
  const totalVisitors = trafficChartData.reduce((sum, item) => sum + item.uniqueVisitors, 0)
  const avgSessionDuration = Math.round(
    trafficChartData.reduce((sum, item) => sum + item.avgSessionDuration, 0) / trafficChartData.length,
  )
  const avgBounceRate = (
    trafficChartData.reduce((sum, item) => sum + item.bounceRate, 0) / trafficChartData.length
  ).toFixed(1)

  // Format numbers for display
  const formatNumber = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <TimePeriodSelector periods={timePeriods} activePeriod={timePeriod} onChange={setTimePeriod} />
          <DateRangePicker onChange={handleDateRangeChange} />
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download report</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="traffic" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Page Views"
              value={formatNumber(totalViews)}
              icon={<Eye className="h-4 w-4" />}
              change={5.3}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Unique Visitors"
              value={formatNumber(totalVisitors)}
              icon={<Users className="h-4 w-4" />}
              change={2.1}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Avg. Session Duration"
              value={formatTime(avgSessionDuration)}
              icon={<Clock className="h-4 w-4" />}
              change={-1.2}
              trend="down"
              description="vs. previous period"
            />
            <KpiCard
              title="Bounce Rate"
              value={`${avgBounceRate}%`}
              icon={<ArrowRight className="h-4 w-4" />}
              change={-0.8}
              trend="up"
              description="vs. previous period"
            />
          </div>

          <LineChart
            data={trafficChartData}
            title="Traffic Overview"
            description="Page views and unique visitors over time"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChart
              data={deviceData}
              title="Device Distribution"
              description="Sessions by device type"
              type="doughnut"
            />
            <PieChart data={locationData} title="Geographic Distribution" description="Users by country" type="pie" />
          </div>

          <DataTable
            title="Top Content"
            description="Most viewed pages and their performance metrics"
            data={topContentData}
            columns={[
              { key: "title", header: "Page Title" },
              { key: "path", header: "Path" },
              {
                key: "views",
                header: "Views",
                render: (value) => formatNumber(value),
              },
              {
                key: "avgTimeOnPage",
                header: "Avg. Time on Page",
                render: (value) => `${value}s`,
              },
              {
                key: "bounceRate",
                header: "Bounce Rate",
                render: (value) => `${value}%`,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="events" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Events"
              value="24"
              icon={<Calendar className="h-4 w-4" />}
              change={8.3}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Total Registrations"
              value="3,847"
              icon={<Users className="h-4 w-4" />}
              change={12.5}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Avg. Completion Rate"
              value="78.4%"
              icon={<BarChartIcon className="h-4 w-4" />}
              change={3.2}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Avg. Rating"
              value="4.6"
              icon={<LineChartIcon className="h-4 w-4" />}
              change={0.2}
              trend="up"
              description="vs. previous period"
            />
          </div>

          <BarChart
            data={eventEngagementData}
            title="Event Performance"
            description="Views and registrations by event"
          />

          <DataTable
            title="Event Engagement"
            description="Detailed metrics for all events"
            data={eventEngagementData}
            columns={[
              { key: "eventName", header: "Event Name" },
              {
                key: "views",
                header: "Views",
                render: (value) => formatNumber(value),
              },
              {
                key: "registrations",
                header: "Registrations",
                render: (value) => formatNumber(value),
              },
              {
                key: "completionRate",
                header: "Completion Rate",
                render: (value) => `${value}%`,
              },
              {
                key: "rating",
                header: "Rating",
                render: (value) => value,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="forms" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Forms"
              value="12"
              icon={<FileText className="h-4 w-4" />}
              change={2}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Form Views"
              value="6,132"
              icon={<Eye className="h-4 w-4" />}
              change={8.7}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Form Completions"
              value="3,312"
              icon={<BarChartIcon className="h-4 w-4" />}
              change={5.4}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Avg. Abandonment Rate"
              value="21.1%"
              icon={<PieChartIcon className="h-4 w-4" />}
              change={-1.8}
              trend="up"
              description="vs. previous period"
            />
          </div>

          <DataTable
            title="Form Performance"
            description="Detailed metrics for all forms"
            data={formSubmissionData}
            columns={[
              { key: "formName", header: "Form Name" },
              {
                key: "views",
                header: "Views",
                render: (value) => formatNumber(value),
              },
              {
                key: "starts",
                header: "Starts",
                render: (value) => formatNumber(value),
              },
              {
                key: "completions",
                header: "Completions",
                render: (value) => formatNumber(value),
              },
              {
                key: "abandonmentRate",
                header: "Abandonment Rate",
                render: (value) => `${value}%`,
              },
              {
                key: "avgCompletionTime",
                header: "Avg. Completion Time",
                render: (value) => `${value}s`,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Users"
              value="12,654"
              icon={<Users className="h-4 w-4" />}
              change={7.2}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="New Users"
              value="4,582"
              icon={<Users className="h-4 w-4" />}
              change={12.8}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Avg. Conversion Rate"
              value="14.7%"
              icon={<BarChartIcon className="h-4 w-4" />}
              change={1.3}
              trend="up"
              description="vs. previous period"
            />
            <KpiCard
              title="Active Users"
              value="8,321"
              icon={<Users className="h-4 w-4" />}
              change={5.6}
              trend="up"
              description="vs. previous period"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChart
              data={userAcquisitionData.map((item) => ({
                country: item.source,
                users: item.users,
                percentage: ((item.users / userAcquisitionData.reduce((sum, i) => sum + i.users, 0)) * 100).toFixed(1),
              }))}
              title="User Acquisition"
              description="Users by acquisition source"
              type="pie"
            />
            <DataTable
              title="Acquisition Sources"
              description="Detailed metrics for user acquisition"
              data={userAcquisitionData}
              columns={[
                { key: "source", header: "Source" },
                {
                  key: "users",
                  header: "Users",
                  render: (value) => formatNumber(value),
                },
                {
                  key: "newUsers",
                  header: "New Users",
                  render: (value) => formatNumber(value),
                },
                {
                  key: "conversionRate",
                  header: "Conversion Rate",
                  render: (value) => `${value}%`,
                },
              ]}
              pagination={false}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
