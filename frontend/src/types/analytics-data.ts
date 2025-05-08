// Types for analytics data
export interface PageView {
    date: string
    views: number
    uniqueVisitors: number
    bounceRate: number
    avgSessionDuration: number
  }
  
  export interface EventEngagement {
    eventId: string
    eventName: string
    views: number
    registrations: number
    completionRate: number
    rating: number
  }
  
  export interface UserAcquisition {
    source: string
    users: number
    newUsers: number
    conversionRate: number
  }
  
  export interface FormSubmission {
    formId: string
    formName: string
    views: number
    starts: number
    completions: number
    abandonmentRate: number
    avgCompletionTime: number
  }
  
  export interface DeviceData {
    device: string
    sessions: number
    percentage: number
  }
  
  export interface LocationData {
    country: string
    users: number
    percentage: number
  }
  
  export interface TopContent {
    path: string
    title: string
    views: number
    avgTimeOnPage: number
    bounceRate: number
  }
  
  // Mock data for traffic analytics
  export const trafficData: PageView[] = [
    { date: "2023-05-01", views: 1245, uniqueVisitors: 876, bounceRate: 42.3, avgSessionDuration: 124 },
    { date: "2023-05-02", views: 1322, uniqueVisitors: 954, bounceRate: 40.1, avgSessionDuration: 135 },
    { date: "2023-05-03", views: 1401, uniqueVisitors: 1021, bounceRate: 38.7, avgSessionDuration: 142 },
    { date: "2023-05-04", views: 1278, uniqueVisitors: 932, bounceRate: 41.5, avgSessionDuration: 128 },
    { date: "2023-05-05", views: 1356, uniqueVisitors: 987, bounceRate: 39.8, avgSessionDuration: 138 },
    { date: "2023-05-06", views: 1189, uniqueVisitors: 854, bounceRate: 43.2, avgSessionDuration: 119 },
    { date: "2023-05-07", views: 1098, uniqueVisitors: 789, bounceRate: 45.6, avgSessionDuration: 112 },
    { date: "2023-05-08", views: 1432, uniqueVisitors: 1045, bounceRate: 37.9, avgSessionDuration: 145 },
    { date: "2023-05-09", views: 1521, uniqueVisitors: 1123, bounceRate: 36.4, avgSessionDuration: 152 },
    { date: "2023-05-10", views: 1476, uniqueVisitors: 1087, bounceRate: 37.1, avgSessionDuration: 148 },
    { date: "2023-05-11", views: 1389, uniqueVisitors: 1012, bounceRate: 38.5, avgSessionDuration: 140 },
    { date: "2023-05-12", views: 1467, uniqueVisitors: 1078, bounceRate: 37.3, avgSessionDuration: 147 },
    { date: "2023-05-13", views: 1298, uniqueVisitors: 943, bounceRate: 40.9, avgSessionDuration: 131 },
    { date: "2023-05-14", views: 1187, uniqueVisitors: 852, bounceRate: 43.4, avgSessionDuration: 120 },
  ]
  
  // Mock data for event engagement
  export const eventEngagementData: EventEngagement[] = [
    {
      eventId: "evt001",
      eventName: "Community Health Workshop",
      views: 876,
      registrations: 342,
      completionRate: 78.2,
      rating: 4.7,
    },
    {
      eventId: "evt002",
      eventName: "Mental Health Awareness",
      views: 1245,
      registrations: 567,
      completionRate: 82.5,
      rating: 4.9,
    },
    {
      eventId: "evt003",
      eventName: "Youth Leadership Summit",
      views: 932,
      registrations: 421,
      completionRate: 75.8,
      rating: 4.5,
    },
    {
      eventId: "evt004",
      eventName: "Cultural Diversity Festival",
      views: 1543,
      registrations: 789,
      completionRate: 88.3,
      rating: 4.8,
    },
    {
      eventId: "evt005",
      eventName: "Environmental Sustainability",
      views: 654,
      registrations: 231,
      completionRate: 71.4,
      rating: 4.3,
    },
    {
      eventId: "evt006",
      eventName: "Tech for Social Good",
      views: 1087,
      registrations: 498,
      completionRate: 80.1,
      rating: 4.6,
    },
    {
      eventId: "evt007",
      eventName: "Community Art Exhibition",
      views: 765,
      registrations: 312,
      completionRate: 76.9,
      rating: 4.4,
    },
    {
      eventId: "evt008",
      eventName: "Financial Literacy Workshop",
      views: 543,
      registrations: 187,
      completionRate: 68.7,
      rating: 4.2,
    },
  ]
  
  // Mock data for user acquisition
  export const userAcquisitionData: UserAcquisition[] = [
    { source: "Direct", users: 2345, newUsers: 876, conversionRate: 12.4 },
    { source: "Organic Search", users: 3567, newUsers: 1432, conversionRate: 15.7 },
    { source: "Social Media", users: 1876, newUsers: 954, conversionRate: 10.8 },
    { source: "Email", users: 1243, newUsers: 567, conversionRate: 18.2 },
    { source: "Referral", users: 987, newUsers: 432, conversionRate: 14.5 },
    { source: "Paid Search", users: 654, newUsers: 321, conversionRate: 16.3 },
  ]
  
  // Mock data for form submissions
  export const formSubmissionData: FormSubmission[] = [
    {
      formId: "frm001",
      formName: "Event Registration Form",
      views: 1245,
      starts: 876,
      completions: 654,
      abandonmentRate: 25.3,
      avgCompletionTime: 187,
    },
    {
      formId: "frm002",
      formName: "Feedback Survey",
      views: 987,
      starts: 654,
      completions: 543,
      abandonmentRate: 17.0,
      avgCompletionTime: 142,
    },
    {
      formId: "frm003",
      formName: "Volunteer Application",
      views: 765,
      starts: 432,
      completions: 321,
      abandonmentRate: 25.7,
      avgCompletionTime: 235,
    },
    {
      formId: "frm004",
      formName: "Workshop Registration",
      views: 1087,
      starts: 765,
      completions: 598,
      abandonmentRate: 21.8,
      avgCompletionTime: 165,
    },
    {
      formId: "frm005",
      formName: "Contact Form",
      views: 1432,
      starts: 987,
      completions: 876,
      abandonmentRate: 11.2,
      avgCompletionTime: 98,
    },
    {
      formId: "frm006",
      formName: "Donation Form",
      views: 654,
      starts: 432,
      completions: 321,
      abandonmentRate: 25.7,
      avgCompletionTime: 154,
    },
  ]
  
  // Mock data for device usage
  export const deviceData: DeviceData[] = [
    { device: "Desktop", sessions: 4532, percentage: 45.3 },
    { device: "Mobile", sessions: 4123, percentage: 41.2 },
    { device: "Tablet", sessions: 1345, percentage: 13.5 },
  ]
  
  // Mock data for user locations
  export const locationData: LocationData[] = [
    { country: "United States", users: 3456, percentage: 34.6 },
    { country: "United Kingdom", users: 1234, percentage: 12.3 },
    { country: "Canada", users: 987, percentage: 9.9 },
    { country: "Australia", users: 876, percentage: 8.8 },
    { country: "Germany", users: 765, percentage: 7.7 },
    { country: "France", users: 654, percentage: 6.5 },
    { country: "India", users: 543, percentage: 5.4 },
    { country: "Other", users: 1485, percentage: 14.8 },
  ]
  
  // Mock data for top content
  export const topContentData: TopContent[] = [
    {
      path: "/events/mental-health-awareness",
      title: "Mental Health Awareness",
      views: 1245,
      avgTimeOnPage: 187,
      bounceRate: 32.4,
    },
    {
      path: "/events/community-health-workshop",
      title: "Community Health Workshop",
      views: 987,
      avgTimeOnPage: 165,
      bounceRate: 35.7,
    },
    {
      path: "/events/cultural-diversity-festival",
      title: "Cultural Diversity Festival",
      views: 876,
      avgTimeOnPage: 192,
      bounceRate: 30.1,
    },
    {
      path: "/events/youth-leadership-summit",
      title: "Youth Leadership Summit",
      views: 765,
      avgTimeOnPage: 178,
      bounceRate: 33.8,
    },
    {
      path: "/events/tech-for-social-good",
      title: "Tech for Social Good",
      views: 654,
      avgTimeOnPage: 156,
      bounceRate: 38.2,
    },
  ]
  
  // Function to generate time series data for custom date ranges
  export function generateTimeSeriesData(startDate: Date, endDate: Date): PageView[] {
    const data: PageView[] = []
    const currentDate = new Date(startDate)
  
    while (currentDate <= endDate) {
      const views = Math.floor(Math.random() * 1000) + 500
      const uniqueVisitors = Math.floor(views * (0.6 + Math.random() * 0.2))
      const bounceRate = 30 + Math.random() * 20
      const avgSessionDuration = 90 + Math.random() * 90
  
      data.push({
        date: currentDate.toISOString().split("T")[0],
        views,
        uniqueVisitors,
        bounceRate: Number.parseFloat(bounceRate.toFixed(1)),
        avgSessionDuration: Math.floor(avgSessionDuration),
      })
  
      currentDate.setDate(currentDate.getDate() + 1)
    }
  
    return data
  }
  
  // Function to get data for a specific time period
  export function getDataForTimePeriod(period: "day" | "week" | "month" | "year"): PageView[] {
    const endDate = new Date()
    const startDate = new Date()
  
    switch (period) {
      case "day":
        startDate.setDate(endDate.getDate() - 1)
        break
      case "week":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "month":
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }
  
    return generateTimeSeriesData(startDate, endDate)
  }
  