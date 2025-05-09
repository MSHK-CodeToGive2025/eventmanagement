import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CalendarIcon,
  Edit,
  MoreHorizontal,
  Trash2,
  MapPin,
  Tag,
  UserCircle,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  X,
  FileText,
  Clock,
  MessageSquare,
} from "lucide-react"

// Event categories mapping
const categoryNames = {
  education: "Education & Training",
  cultural: "Cultural Exchange",
  health: "Health & Wellness",
  career: "Career Development",
  community: "Community Building",
  language: "Language Learning",
  social: "Social Integration",
  youth: "Youth Programs",
  women: "Women's Empowerment",
  other: "Other",
}

// Target groups mapping
const targetGroupNames = {
  all: "All Hong Kong Residents",
  "ethnic-minorities": "Ethnic Minorities",
  "south-asian": "South Asian Community",
  women: "Women",
  youth: "Youth (13-25)",
  children: "Children (0-12)",
  seniors: "Seniors (65+)",
  professionals: "Professionals",
  newcomers: "Newcomers to Hong Kong",
  other: "Other",
}

// Status options
const statusOptions = ["Draft", "Published", "Upcoming", "Ongoing", "Completed", "Cancelled"]

// Registration forms
const registrationForms = [
  { id: "form1", title: "Basic Registration Form" },
  { id: "form2", title: "Detailed Participant Information" },
  { id: "form3", title: "Workshop Registration" },
  { id: "form4", title: "Cultural Event Registration" },
  { id: "form5", title: "Health Seminar Registration" },
  { id: "form6", title: "Youth Program Application" },
]

// Mock events data with form and status fields
const mockEvents = [
  {
    id: "1",
    title: "Career Workshop for Ethnic Minorities",
    description:
      "A workshop designed to help ethnic minorities in Hong Kong develop career skills and find employment opportunities.",
    date: "2025-06-15",
    startTime: "14:00",
    endTime: "17:00",
    location: "Wan Chai Community Center",
    capacity: "50",
    category: "career",
    targetGroup: "ethnic-minorities",
    details: "<p>This workshop will cover resume writing, interview skills, and job search strategies.</p>",
    faqs: "<p><strong>Q: Do I need to bring anything?</strong></p><p>A: Just bring a notebook and pen.</p>",
    imageUrl: "/placeholder.svg?key=cegm9",
    status: "Upcoming",
    registrations: 12,
    registrationForm: "form3",
  },
  {
    id: "2",
    title: "Cultural Exchange Festival",
    description: "Celebrate the diverse cultures of Hong Kong's ethnic minorities through food, music, dance, and art.",
    date: "2025-07-22",
    startTime: "11:00",
    endTime: "20:00",
    location: "Victoria Park, Causeway Bay",
    capacity: "500",
    category: "cultural",
    targetGroup: "all",
    details:
      "<p>Join us for a day of cultural celebration featuring performances, food stalls, and interactive activities.</p>",
    faqs: "",
    imageUrl: "/vibrant-cultural-festival.png",
    status: "Published",
    registrations: 78,
    registrationForm: "form4",
  },
  {
    id: "3",
    title: "Language Learning Program",
    description:
      "Free Cantonese classes for non-Chinese speaking residents to improve integration and employment prospects.",
    date: "2025-08-05",
    startTime: "10:00",
    endTime: "12:00",
    location: "Zubin Foundation Office, Wan Chai",
    capacity: "30",
    category: "language",
    targetGroup: "ethnic-minorities",
    details: "<p>Weekly classes focusing on practical Cantonese for daily life and work situations.</p>",
    faqs: "<p><strong>Q: What level is this class for?</strong></p><p>A: Beginners with no prior knowledge of Cantonese.</p>",
    imageUrl: "/placeholder.svg?key=2hggs",
    status: "Draft",
    registrations: 25,
    registrationForm: "form1",
  },
  {
    id: "4",
    title: "Health Awareness Seminar",
    description: "Information session on healthcare access and services available for ethnic minority communities.",
    date: "2025-09-10",
    startTime: "15:00",
    endTime: "17:30",
    location: "Kwun Tong Community Hall",
    capacity: "100",
    category: "health",
    targetGroup: "ethnic-minorities",
    details: "<p>Learn about healthcare services, insurance options, and preventive care.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=1sazv",
    status: "Published",
    registrations: 45,
    registrationForm: "form5",
  },
  {
    id: "5",
    title: "Virtual Career Fair",
    description: "Online job fair connecting ethnic minority job seekers with inclusive employers.",
    date: "2025-10-15",
    startTime: "09:00",
    endTime: "17:00",
    location: "Online via Zoom",
    capacity: "200",
    category: "career",
    targetGroup: "professionals",
    details: "<p>Meet representatives from companies committed to diversity and inclusion.</p>",
    faqs: "<p><strong>Q: How do I prepare?</strong></p><p>A: Have your resume ready and test your camera/mic before the event.</p>",
    imageUrl: "/placeholder.svg?key=3jklm",
    status: "Upcoming",
    registrations: 120,
    registrationForm: "form2",
  },
  {
    id: "6",
    title: "Youth Leadership Workshop",
    description: "Workshop to develop leadership skills among ethnic minority youth.",
    date: "2025-11-05",
    startTime: "13:00",
    endTime: "17:00",
    location: "Mong Kok Community Center",
    capacity: "40",
    category: "youth",
    targetGroup: "youth",
    details: "<p>Interactive workshop focusing on communication, teamwork, and project management skills.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=4pqrs",
    status: "Draft",
    registrations: 0,
    registrationForm: "form6",
  },
  {
    id: "7",
    title: "Women's Empowerment Seminar",
    description: "Seminar focused on empowering women from ethnic minority backgrounds.",
    date: "2025-12-10",
    startTime: "10:00",
    endTime: "15:00",
    location: "Central Library, Causeway Bay",
    capacity: "80",
    category: "women",
    targetGroup: "women",
    details: "<p>Featuring guest speakers, networking opportunities, and skill-building workshops.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=5tuvw",
    status: "Published",
    registrations: 35,
    registrationForm: "form2",
  },
  {
    id: "8",
    title: "Community Health Fair",
    description: "Health fair providing free screenings and health information to the community.",
    date: "2026-01-15",
    startTime: "09:00",
    endTime: "16:00",
    location: "Tung Chung Community Hall",
    capacity: "300",
    category: "health",
    targetGroup: "all",
    details: "<p>Free health screenings, consultations with healthcare providers, and health education workshops.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=6xyza",
    status: "Draft",
    registrations: 0,
    registrationForm: "form5",
  },
  {
    id: "9",
    title: "Educational Support Program",
    description: "Program providing educational support to ethnic minority students.",
    date: "2026-02-20",
    startTime: "15:00",
    endTime: "17:00",
    location: "Zubin Foundation Office, Wan Chai",
    capacity: "25",
    category: "education",
    targetGroup: "children",
    details: "<p>Tutoring, homework help, and educational resources for students.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=7bcde",
    status: "Upcoming",
    registrations: 10,
    registrationForm: "form1",
  },
  {
    id: "10",
    title: "Cultural Integration Workshop",
    description: "Workshop to help newcomers integrate into Hong Kong society.",
    date: "2026-03-05",
    startTime: "14:00",
    endTime: "16:30",
    location: "Sham Shui Po Community Center",
    capacity: "60",
    category: "social",
    targetGroup: "newcomers",
    details: "<p>Information on local customs, practical tips for daily life, and networking opportunities.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=8fghi",
    status: "Draft",
    registrations: 0,
    registrationForm: "form3",
  },
  {
    id: "11",
    title: "Professional Networking Event",
    description: "Networking event for professionals from diverse backgrounds.",
    date: "2026-04-10",
    startTime: "18:00",
    endTime: "21:00",
    location: "Business Center, Admiralty",
    capacity: "100",
    category: "career",
    targetGroup: "professionals",
    details: "<p>Opportunity to connect with professionals across industries and build your network.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=9jklm",
    status: "Upcoming",
    registrations: 45,
    registrationForm: "form2",
  },
  {
    id: "12",
    title: "Community Support Group",
    description: "Support group for ethnic minorities facing challenges in Hong Kong.",
    date: "2026-05-15",
    startTime: "19:00",
    endTime: "21:00",
    location: "Zubin Foundation Office, Wan Chai",
    capacity: "20",
    category: "community",
    targetGroup: "ethnic-minorities",
    details: "<p>Safe space to share experiences, challenges, and support one another.</p>",
    faqs: "",
    imageUrl: "/placeholder.svg?key=0nopq",
    status: "Published",
    registrations: 8,
    registrationForm: "form1",
  },
]

// Define the interface for the event object
interface Event {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  capacity: string
  category: string
  targetGroup: string
  details: string
  faqs: string
  imageUrl: string
  status: string
  registrations: number
  registrationForm: string
}

// Define the interface for the filter state
interface FilterState {
  title: string
  location: string
  category: string[]
  targetGroup: string[]
  status: string[]
  registrationForm: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
}

interface EnhancedEventsListProps {
  onEditEvent: (eventId: string) => void
}

export default function EnhancedEventsList({ onEditEvent }: EnhancedEventsListProps) {
  // State for search, filters, sorting, and pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    title: "",
    location: "",
    category: [],
    targetGroup: [],
    status: [],
    registrationForm: [],
    dateRange: {
      from: null,
      to: null,
    },
  })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Reset pagination when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  // Update active filters for the filter badges
  useEffect(() => {
    const newActiveFilters: string[] = []

    if (filters.title) newActiveFilters.push("Title")
    if (filters.location) newActiveFilters.push("Location")
    if (filters.category.length > 0) newActiveFilters.push("Category")
    if (filters.targetGroup.length > 0) newActiveFilters.push("Target Group")
    if (filters.status.length > 0) newActiveFilters.push("Status")
    if (filters.registrationForm.length > 0) newActiveFilters.push("Form")
    if (filters.dateRange.from || filters.dateRange.to) newActiveFilters.push("Date Range")

    setActiveFilters(newActiveFilters)
  }, [filters])

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "ascending" ? "descending" : "ascending"
    }

    setSortConfig({ key, direction })
  }

  // Handle filter changes
  const handleFilterChange = (filterType: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  // Handle checkbox filter changes (for multi-select filters)
  const handleCheckboxFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[filterType] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      return {
        ...prev,
        [filterType]: newValues,
      }
    })
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      title: "",
      location: "",
      category: [],
      targetGroup: [],
      status: [],
      registrationForm: [],
      dateRange: {
        from: null,
        to: null,
      },
    })
    setSearchQuery("")
  }

  // Clear a specific filter
  const clearFilter = (filterType: string) => {
    switch (filterType) {
      case "Title":
        setFilters((prev) => ({ ...prev, title: "" }))
        break
      case "Location":
        setFilters((prev) => ({ ...prev, location: "" }))
        break
      case "Category":
        setFilters((prev) => ({ ...prev, category: [] }))
        break
      case "Target Group":
        setFilters((prev) => ({ ...prev, targetGroup: [] }))
        break
      case "Status":
        setFilters((prev) => ({ ...prev, status: [] }))
        break
      case "Form":
        setFilters((prev) => ({ ...prev, registrationForm: [] }))
        break
      case "Date Range":
        setFilters((prev) => ({ ...prev, dateRange: { from: null, to: null } }))
        break
      default:
        break
    }
  }

  // Filter events based on all filters and search query
  const filteredEvents = mockEvents.filter((event) => {
    // Global search across multiple fields
    const matchesSearch = searchQuery
      ? event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryNames[event.category as keyof typeof categoryNames]
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        targetGroupNames[event.targetGroup as keyof typeof targetGroupNames]
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        event.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        registrationForms
          .find((form) => form.id === event.registrationForm)
          ?.title.toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true

    // Specific field filters
    const matchesTitle = filters.title ? event.title.toLowerCase().includes(filters.title.toLowerCase()) : true

    const matchesLocation = filters.location
      ? event.location.toLowerCase().includes(filters.location.toLowerCase())
      : true

    const matchesCategory = filters.category.length > 0 ? filters.category.includes(event.category) : true

    const matchesTargetGroup = filters.targetGroup.length > 0 ? filters.targetGroup.includes(event.targetGroup) : true

    const matchesStatus = filters.status.length > 0 ? filters.status.includes(event.status) : true

    const matchesForm =
      filters.registrationForm.length > 0 ? filters.registrationForm.includes(event.registrationForm) : true

    // Date range filter
    let matchesDateRange = true
    if (filters.dateRange.from || filters.dateRange.to) {
      const eventDate = new Date(event.date)
      if (filters.dateRange.from && filters.dateRange.to) {
        matchesDateRange = eventDate >= filters.dateRange.from && eventDate <= filters.dateRange.to
      } else if (filters.dateRange.from) {
        matchesDateRange = eventDate >= filters.dateRange.from
      } else if (filters.dateRange.to) {
        matchesDateRange = eventDate <= filters.dateRange.to
      }
    }

    return (
      matchesSearch &&
      matchesTitle &&
      matchesLocation &&
      matchesCategory &&
      matchesTargetGroup &&
      matchesStatus &&
      matchesForm &&
      matchesDateRange
    )
  })

  // Sort the filtered events
  const sortedEvents = [...filteredEvents]
  if (sortConfig) {
    sortedEvents.sort((a, b) => {
      if (sortConfig.key === "date") {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortConfig.direction === "ascending" ? dateA - dateB : dateB - dateA
      }

      if (sortConfig.key === "title") {
        return sortConfig.direction === "ascending" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      }

      if (sortConfig.key === "location") {
        return sortConfig.direction === "ascending"
          ? a.location.localeCompare(b.location)
          : b.location.localeCompare(a.location)
      }

      if (sortConfig.key === "category") {
        const categoryA = categoryNames[a.category as keyof typeof categoryNames] || a.category
        const categoryB = categoryNames[b.category as keyof typeof categoryNames] || b.category
        return sortConfig.direction === "ascending"
          ? categoryA.localeCompare(categoryB)
          : categoryB.localeCompare(categoryA)
      }

      if (sortConfig.key === "targetGroup") {
        const targetGroupA = targetGroupNames[a.targetGroup as keyof typeof targetGroupNames] || a.targetGroup
        const targetGroupB = targetGroupNames[b.targetGroup as keyof typeof targetGroupNames] || b.targetGroup
        return sortConfig.direction === "ascending"
          ? targetGroupA.localeCompare(targetGroupB)
          : targetGroupB.localeCompare(targetGroupA)
      }

      if (sortConfig.key === "form") {
        const formA = registrationForms.find((form) => form.id === a.registrationForm)?.title || ""
        const formB = registrationForms.find((form) => form.id === b.registrationForm)?.title || ""
        return sortConfig.direction === "ascending" ? formA.localeCompare(formB) : formB.localeCompare(formA)
      }

      if (sortConfig.key === "status") {
        return sortConfig.direction === "ascending"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      }

      if (sortConfig.key === "capacity") {
        const capacityA = Number.parseInt(a.capacity)
        const capacityB = Number.parseInt(b.capacity)
        return sortConfig.direction === "ascending" ? capacityA - capacityB : capacityB - capacityA
      }

      if (sortConfig.key === "registrations") {
        return sortConfig.direction === "ascending"
          ? a.registrations - b.registrations
          : b.registrations - a.registrations
      }

      return 0
    })
  }

  // Paginate the sorted events
  const paginatedEvents = sortedEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle delete event
  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    // In a real app, you would delete the event from your backend here
    console.log("Deleting event:", eventToDelete)
    setDeleteDialogOpen(false)
    setEventToDelete(null)
  }

  // Get form title by ID
  const getFormTitle = (formId: string) => {
    return registrationForms.find((form) => form.id === formId)?.title || "No form"
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Global Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search events by title, location, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <Button
            variant={isFilterOpen ? "default" : "outline"}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Active filters:</span>
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="outline" className="flex items-center gap-1 bg-gray-100">
                {filter}
                <button onClick={() => clearFilter(filter)} className="ml-1 hover:text-gray-700">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-sm text-gray-500">
              Clear all
            </Button>
          </div>
        )}

        {/* Advanced Filter Panel */}
        {isFilterOpen && (
          <Card className="mt-2">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Title Filter */}
                <div className="space-y-2">
                  <Label htmlFor="title-filter">Title</Label>
                  <Input
                    id="title-filter"
                    placeholder="Filter by title"
                    value={filters.title}
                    onChange={(e) => handleFilterChange("title", e.target.value)}
                  />
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <Label htmlFor="location-filter">Location</Label>
                  <Input
                    id="location-filter"
                    placeholder="Filter by location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                  />
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        id="from-date"
                        placeholder="From date"
                        value={filters.dateRange.from ? format(filters.dateRange.from, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null
                          handleFilterChange("dateRange", { ...filters.dateRange, from: date })
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="date"
                        id="to-date"
                        placeholder="To date"
                        value={filters.dateRange.to ? format(filters.dateRange.to, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null
                          handleFilterChange("dateRange", { ...filters.dateRange, to: date })
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {Object.entries(categoryNames).map(([id, name]) => (
                      <div key={id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`category-${id}`}
                          checked={filters.category.includes(id)}
                          onCheckedChange={() => handleCheckboxFilterChange("category", id)}
                        />
                        <Label htmlFor={`category-${id}`} className="cursor-pointer text-sm">
                          {name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Group Filter */}
                <div className="space-y-2">
                  <Label>Target Group</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {Object.entries(targetGroupNames).map(([id, name]) => (
                      <div key={id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`target-${id}`}
                          checked={filters.targetGroup.includes(id)}
                          onCheckedChange={() => handleCheckboxFilterChange("targetGroup", id)}
                        />
                        <Label htmlFor={`target-${id}`} className="cursor-pointer text-sm">
                          {name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {statusOptions.map((status) => (
                      <div key={status} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={() => handleCheckboxFilterChange("status", status)}
                        />
                        <Label htmlFor={`status-${status}`} className="cursor-pointer text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registration Form Filter */}
                <div className="space-y-2">
                  <Label>Registration Form</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {registrationForms.map((form) => (
                      <div key={form.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`form-${form.id}`}
                          checked={filters.registrationForm.includes(form.id)}
                          onCheckedChange={() => handleCheckboxFilterChange("registrationForm", form.id)}
                        />
                        <Label htmlFor={`form-${form.id}`} className="cursor-pointer text-sm">
                          {form.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All
                </Button>
                <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Events Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                <div className="flex items-center">
                  Event Title
                  {sortConfig?.key === "title" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  Date & Time
                  {sortConfig?.key === "date" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("location")}>
                <div className="flex items-center">
                  Location
                  {sortConfig?.key === "location" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                <div className="flex items-center">
                  Category
                  {sortConfig?.key === "category" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("targetGroup")}>
                <div className="flex items-center">
                  Target Group
                  {sortConfig?.key === "targetGroup" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("form")}>
                <div className="flex items-center">
                  Form
                  {sortConfig?.key === "form" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center">
                  Status
                  {sortConfig?.key === "status" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("registrations")}>
                <div className="flex items-center">
                  Registered Count
                  {sortConfig?.key === "registrations" &&
                    (sortConfig.direction === "ascending" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No events found. Try a different search or clear filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                        {format(parseISO(event.date), "MMM d, yyyy")}
                      </div>
                      <div className="text-gray-500 text-sm flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      {event.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-gray-500" />
                      <Badge variant="outline" className="bg-gray-50">
                        {categoryNames[event.category as keyof typeof categoryNames]}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm">
                        {targetGroupNames[event.targetGroup as keyof typeof targetGroupNames]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm">{getFormTitle(event.registrationForm)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.status === "Published" || event.status === "Upcoming"
                          ? "default"
                          : event.status === "Draft"
                            ? "outline"
                            : event.status === "Cancelled"
                              ? "destructive"
                              : "secondary"
                      }
                      className={
                        event.status === "Published"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : event.status === "Upcoming"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : event.status === "Draft"
                              ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              : event.status === "Cancelled"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                      }
                    >
                      <div className="flex items-center">
                        {event.status === "Published" || event.status === "Upcoming" ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5"></div>
                        ) : event.status === "Draft" ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-1.5"></div>
                        ) : event.status === "Cancelled" ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-1.5"></div>
                        )}
                        {event.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="font-medium">{event.registrations}</span>
                      <span className="text-gray-500 mx-1">/</span>
                      <span className="text-gray-500">{event.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditEvent(event.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => (window.location.href = `/manage/events/${event.id}/reminders`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send WhatsApp Reminders
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(event.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 border-t">
          <PaginationControls
            currentPage={currentPage}
            totalItems={sortedEvents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and all associated registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
