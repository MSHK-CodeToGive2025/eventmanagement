import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Grid,
  LayoutList,
  MapPin,
  Search,
  Share2,
  SlidersHorizontal,
  X,
  ImageIcon,
  Users,
  Settings,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  format,
  isAfter,
  isBefore,
  addDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  parseISO,
} from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import eventService, { Event } from "@/services/eventService"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePreset {
  id: string;
  label: string;
  getValue: () => DateRange;
}

// Extract unique categories, locations, and target audiences for filters
const getCategories = (events: Event[]) => [...new Set(events.map((event: Event) => event.category))]
const getLocations = (events: Event[]) => [...new Set(events.map((event: Event) => event.location.district))]
const getAudiences = (events: Event[]) => [...new Set(events.map((event: Event) => event.targetGroup))]

// Date range presets
const dateRangePresets: DateRangePreset[] = [
  { id: "today", label: "Today", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  {
    id: "tomorrow",
    label: "Tomorrow",
    getValue: () => ({
      from: startOfDay(addDays(new Date(), 1)),
      to: endOfDay(addDays(new Date(), 1)),
    }),
  },
  {
    id: "this-week",
    label: "This Week",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    id: "next-week",
    label: "Next Week",
    getValue: () => ({
      from: startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }),
      to: endOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }),
    }),
  },
  {
    id: "this-month",
    label: "This Month",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  { id: "custom", label: "Custom Range", getValue: () => ({ from: undefined, to: undefined }) },
]

export default function EventsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // State for events from backend
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>("custom")
  const [isLoading, setIsLoading] = useState(true)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [eventsPerPage, setEventsPerPage] = useState(6)

  // Sorting state
  const [sortBy, setSortBy] = useState("date-asc")

  // Filter visibility state for mobile
  const [showFilters, setShowFilters] = useState(false)

  // View mode state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter sheet state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  // Temporary filter states for the sheet
  const [tempCategories, setTempCategories] = useState<string[]>([])
  const [tempLocations, setTempLocations] = useState<string[]>([])
  const [tempAudiences, setTempAudiences] = useState<string[]>([])
  const [tempDateRange, setTempDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [tempDatePreset, setTempDatePreset] = useState<string>("custom")

  // Desktop filter visibility state
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false)

  // Display preferences state
  const [showImages, setShowImages] = useState(true)
  const [showCapacity, setShowCapacity] = useState(true)
  const [isDisplayOptionsOpen, setIsDisplayOptionsOpen] = useState(false)

  // New date range state
  const [newDateRange, setNewDateRange] = useState<DateRange>({ from: undefined, to: undefined })

  // Function to update URL with current filters
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams()

    // Add search query
    if (searchQuery) {
      params.set("q", searchQuery)
    }

    // Add categories
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","))
    }

    // Add locations
    if (selectedLocations.length > 0) {
      params.set("locations", selectedLocations.join(","))
    }

    // Add audiences
    if (selectedAudiences.length > 0) {
      params.set("audiences", selectedAudiences.join(","))
    }

    // Add date preset
    if (selectedDatePreset !== "custom") {
      params.set("datePreset", selectedDatePreset)
    } else {
      // Add custom date range
      if (dateRange.from) {
        params.set("from", dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.set("to", dateRange.to.toISOString())
      }
    }

    // Add sort
    if (sortBy !== "date-asc") {
      params.set("sort", sortBy)
    }

    // Add view mode
    if (viewMode !== "grid") {
      params.set("view", viewMode)
    }

    // Add page
    if (currentPage > 1) {
      params.set("page", currentPage.toString())
    }

    // Add events per page
    if (eventsPerPage !== 6) {
      params.set("perPage", eventsPerPage.toString())
    }

    // Update URL without refreshing the page
    setSearchParams(params)
  }, [
    searchQuery,
    selectedCategories,
    selectedLocations,
    selectedAudiences,
    dateRange,
    selectedDatePreset,
    sortBy,
    viewMode,
    currentPage,
    eventsPerPage,
    setSearchParams,
  ])

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true)
        const publicEvents = await eventService.getPublicEvents()
        setEvents(publicEvents)
      } catch (err) {
        console.error('Error fetching events:', err)
        setEventsError('Failed to load events')
      } finally {
        setEventsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Load filters from URL on initial load
  useEffect(() => {
    // Get search query
    const q = searchParams.get("q")
    if (q) {
      setSearchQuery(q)
    }

    // Get categories
    const categoriesParam = searchParams.get("categories")
    if (categoriesParam) {
      const categoriesList = categoriesParam.split(",")
      setSelectedCategories(categoriesList.filter((cat) => categories.includes(cat)))
    }

    // Get locations
    const locationsParam = searchParams.get("locations")
    if (locationsParam) {
      const locationsList = locationsParam.split(",")
      setSelectedLocations(locationsList.filter((loc) => locations.includes(loc)))
    }

    // Get audiences
    const audiencesParam = searchParams.get("audiences")
    if (audiencesParam) {
      const audiencesList = audiencesParam.split(",")
      setSelectedAudiences(audiencesList.filter((aud) => audiences.includes(aud)))
    }

    // Get date preset or custom date range
    const datePresetParam = searchParams.get("datePreset")
    if (datePresetParam && dateRangePresets.some((preset) => preset.id === datePresetParam)) {
      setSelectedDatePreset(datePresetParam)
      const preset = dateRangePresets.find((p) => p.id === datePresetParam)
      if (preset) {
        setDateRange(preset.getValue())
      }
    } else {
      // Get custom date range
      const fromParam = searchParams.get("from")
      const toParam = searchParams.get("to")
      const newDateRange: DateRange = { from: undefined, to: undefined }

      if (fromParam) {
        try {
          newDateRange.from = parseISO(fromParam)
        } catch (e) {
          console.error("Invalid from date in URL", e)
        }
      }

      if (toParam) {
        try {
          newDateRange.to = parseISO(toParam)
        } catch (e) {
          console.error("Invalid to date in URL", e)
        }
      }

      if (newDateRange.from || newDateRange.to) {
        setDateRange(newDateRange)
      }
    }

    // Get sort
    const sortParam = searchParams.get("sort")
    if (sortParam) {
      setSortBy(sortParam)
    }

    // Get view mode
    const viewParam = searchParams.get("view") as "grid" | "list" | null
    if (viewParam && (viewParam === "grid" || viewParam === "list")) {
      setViewMode(viewParam)
    }

    // Get page
    const pageParam = searchParams.get("page")
    if (pageParam) {
      const page = Number.parseInt(pageParam, 10)
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page)
      }
    }

    // Get events per page
    const perPageParam = searchParams.get("perPage")
    if (perPageParam) {
      const perPage = Number.parseInt(perPageParam, 10)
      if (!isNaN(perPage) && [6, 12, 24].includes(perPage)) {
        setEventsPerPage(perPage)
      }
    }
  }, [searchParams])

  // Load display preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load view mode preference
      const savedViewMode = localStorage.getItem("eventsViewMode") as "grid" | "list" | null
      if (savedViewMode) {
        setViewMode(savedViewMode)
      }

      // Load display preferences
      const savedShowImages = localStorage.getItem("eventsShowImages")
      if (savedShowImages !== null) {
        setShowImages(savedShowImages === "true")
      }

      const savedShowCapacity = localStorage.getItem("eventsShowCapacity")
      if (savedShowCapacity !== null) {
        setShowCapacity(savedShowCapacity === "true")
      }
    }
  }, [])

  // Save display preferences to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("eventsViewMode", viewMode)
      localStorage.setItem("eventsShowImages", showImages.toString())
      localStorage.setItem("eventsShowCapacity", showCapacity.toString())
    }
  }, [viewMode, showImages, showCapacity])

  // Update URL when filters change
  useEffect(() => {
    if (!isLoading) {
      updateUrlWithFilters()
    }
  }, [
    searchQuery,
    selectedCategories,
    selectedLocations,
    selectedAudiences,
    dateRange,
    selectedDatePreset,
    sortBy,
    viewMode,
    currentPage,
    eventsPerPage,
    isLoading,
    updateUrlWithFilters,
  ])

  // Initialize temp filters when sheet opens
  useEffect(() => {
    if (isFilterSheetOpen) {
      setTempCategories([...selectedCategories])
      setTempLocations([...selectedLocations])
      setTempAudiences([...selectedAudiences])
      setTempDateRange({ ...dateRange })
      setTempDatePreset(selectedDatePreset)
    }
  }, [isFilterSheetOpen])

  // Apply date preset
  const applyDatePreset = (presetId: string) => {
    if (presetId === "custom") {
      return
    }

    const preset = dateRangePresets.find((p) => p.id === presetId)
    if (preset) {
      setDateRange(preset.getValue())
    }
  }

  // Apply temp date preset
  const applyTempDatePreset = (presetId: string) => {
    if (presetId === "custom") {
      return
    }

    const preset = dateRangePresets.find((p) => p.id === presetId)
    if (preset) {
      setTempDateRange(preset.getValue())
    }
  }

  // Apply filters from sheet
  const applyFilters = () => {
    setSelectedCategories(tempCategories)
    setSelectedLocations(tempLocations)
    setSelectedAudiences(tempAudiences)
    setDateRange(tempDateRange)
    setSelectedDatePreset(tempDatePreset)
    setIsFilterSheetOpen(false)
  }

  // Update date preset when date range changes
  useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      setSelectedDatePreset("custom")
      return
    }

    // Check if current date range matches any preset
    const matchingPreset = dateRangePresets.find((preset) => {
      if (preset.id === "custom") return false

      const presetRange = preset.getValue()

      // Compare dates (ignoring time for simplicity)
      const fromMatch =
        !dateRange.from || !presetRange.from || dateRange.from.toDateString() === presetRange.from.toDateString()

      const toMatch = !dateRange.to || !presetRange.to || dateRange.to.toDateString() === presetRange.to.toDateString()

      return fromMatch && toMatch
    })

    setSelectedDatePreset(matchingPreset?.id || "custom")
  }, [dateRange])

  // Update temp date preset when temp date range changes
  useEffect(() => {
    if (!tempDateRange.from && !tempDateRange.to) {
      setTempDatePreset("custom")
      return
    }

    // Check if current date range matches any preset
    const matchingPreset = dateRangePresets.find((preset) => {
      if (preset.id === "custom") return false

      const presetRange = preset.getValue()

      // Compare dates (ignoring time for simplicity)
      const fromMatch =
        !tempDateRange.from ||
        !presetRange.from ||
        tempDateRange.from.toDateString() === presetRange.from.toDateString()

      const toMatch =
        !tempDateRange.to || !presetRange.to || tempDateRange.to.toDateString() === presetRange.to.toDateString()

      return fromMatch && toMatch
    })

    setTempDatePreset(matchingPreset?.id || "custom")
  }, [tempDateRange])

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Apply filters and search
  const filteredEvents = publishedEvents.filter((event) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Category filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category)

    // Location filter
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(event.location)

    // Audience filter
    const matchesAudience = selectedAudiences.length === 0 || selectedAudiences.includes(event.targetAudience)

    // Date range filter
    let matchesDateRange = true
    if (dateRange.from) {
      matchesDateRange = matchesDateRange && isAfter(new Date(event.date), dateRange.from)
    }
    if (dateRange.to) {
      matchesDateRange = matchesDateRange && isBefore(new Date(event.date), dateRange.to)
    }

    return matchesSearch && matchesCategory && matchesLocation && matchesAudience && matchesDateRange
  })

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case "date-desc":
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case "title-asc":
        return a.title.localeCompare(b.title)
      case "title-desc":
        return b.title.localeCompare(a.title)
      case "popularity":
        return b.registrations / b.capacity - a.registrations / a.capacity
      default:
        return 0
    }
  })

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent)
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategories, selectedLocations, selectedAudiences, dateRange, sortBy])

  // Handle page change
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setSelectedLocations([])
    setSelectedAudiences([])
    setDateRange({ from: undefined, to: undefined })
    setSortBy("date-asc")
    setSelectedDatePreset("custom")
  }

  // Clear all temp filters
  const clearTempFilters = () => {
    setTempCategories([])
    setTempLocations([])
    setTempAudiences([])
    setTempDateRange({ from: undefined, to: undefined })
    setTempDatePreset("custom")
  }

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  // Toggle temp category selection
  const toggleTempCategory = (category: string) => {
    setTempCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]))
  }

  // Toggle location selection
  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) => (prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]))
  }

  // Toggle temp location selection
  const toggleTempLocation = (location: string) => {
    setTempLocations((prev) => (prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]))
  }

  // Toggle audience selection
  const toggleAudience = (audience: string) => {
    setSelectedAudiences((prev) => (prev.includes(audience) ? prev.filter((a) => a !== audience) : [...prev, audience]))
  }

  // Toggle temp audience selection
  const toggleTempAudience = (audience: string) => {
    setTempAudiences((prev) => (prev.includes(audience) ? prev.filter((a) => a !== audience) : [...prev, audience]))
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (selectedCategories.length > 0) count++
    if (selectedLocations.length > 0) count++
    if (selectedAudiences.length > 0) count++
    if (dateRange.from || dateRange.to) count++
    return count
  }

  // Handle click outside to close desktop filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const filterButton = document.getElementById("desktop-filter-button")
      const filterPanel = document.getElementById("desktop-filter-panel")

      if (
        isDesktopFilterOpen &&
        filterButton &&
        filterPanel &&
        !filterButton.contains(event.target as Node) &&
        !filterPanel.contains(event.target as Node)
      ) {
        setIsDesktopFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDesktopFilterOpen])

  // Add this function near the other event handlers
  const handleFilterPanelClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // Share current view
  const shareCurrentView = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Filtered Events - Zubin Foundation",
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          console.log("Link copied to clipboard - You can now share this filtered view with others")
        })
        .catch((err) => {
          console.error("Failed to copy:", err)
          console.error("Failed to copy link - Please try again or copy the URL manually")
        })
    }
  }

  // Toggle display options
  const toggleDisplayOptions = () => {
    setIsDisplayOptionsOpen(!isDisplayOptionsOpen)
  }

  // Apply display options
  const applyDisplayOptions = () => {
    setIsDisplayOptionsOpen(false)
    console.log(`Display preferences updated - Images: ${showImages ? "Shown" : "Hidden"}, Capacity: ${showCapacity ? "Shown" : "Hidden"}`)
  }

  // Reset display options to defaults
  const resetDisplayOptions = () => {
    setShowImages(true)
    setShowCapacity(true)
    console.log("Display preferences reset - Default display settings have been restored")
  }

  // Update navigation calls
  const navigateToEvent = (eventId: string) => {
    navigate(`/events/${eventId}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover and register for events organized by The Zubin Foundation to support ethnic minorities in Hong Kong.
        </p>
      </div>

      {/* Redesigned Search and Filter Bar */}
      <div className="mb-8 bg-white rounded-lg shadow">
        {/* Header section with title and search */}
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={shareCurrentView} aria-label="Share this view">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share this filtered view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" className="hidden md:flex" onClick={() => navigate("/events/categories")}>
                <Grid className="h-4 w-4 mr-2" />
                Browse by Category
              </Button>
            </div>
          </div>
        </div>

        {/* Controls section with view options and filters */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left side - Sort and view controls */}
            <div className="flex flex-wrap gap-2 flex-grow">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                  <SelectItem value="date-desc">Date (Latest)</SelectItem>
                  <SelectItem value="title-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500 hidden md:inline">View:</span>
                <div className="flex border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-none rounded-l-md border-r h-9 px-3",
                      viewMode === "grid" ? "bg-gray-100" : "",
                    )}
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("rounded-none rounded-r-md h-9 px-3", viewMode === "list" ? "bg-gray-100" : "")}
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Display Options Dropdown */}
              <DropdownMenu open={isDisplayOptionsOpen} onOpenChange={setIsDisplayOptionsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Display options" className="h-9">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Display Options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Display Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4" />
                        <span>Show Images</span>
                      </div>
                      <Switch checked={showImages} onCheckedChange={setShowImages} aria-label="Toggle images" />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Show Capacity</span>
                      </div>
                      <Switch checked={showCapacity} onCheckedChange={setShowCapacity} aria-label="Toggle capacity" />
                    </div>

                    <div className="flex justify-between mt-4 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={resetDisplayOptions} className="text-xs">
                        Reset
                      </Button>
                      <Button size="sm" onClick={applyDisplayOptions} className="text-xs">
                        Apply
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right side - Filter controls */}
            <div className="flex gap-2">
              {/* Enhanced Filter Button - Mobile */}
              <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] sm:h-[85vh] p-0">
                  <SheetHeader className="p-4 border-b sticky top-0 bg-white z-10">
                    <SheetTitle>Filter Events</SheetTitle>
                    <SheetDescription>Refine events based on your preferences</SheetDescription>
                  </SheetHeader>
                  <div className="overflow-y-auto h-[calc(100%-10rem)]">
                    <Tabs defaultValue="date" className="w-full">
                      <TabsList className="grid grid-cols-4 p-2 sticky top-[73px] bg-white z-10">
                        <TabsTrigger value="category">Category</TabsTrigger>
                        <TabsTrigger value="location">Location</TabsTrigger>
                        <TabsTrigger value="date">Date</TabsTrigger>
                        <TabsTrigger value="audience">Audience</TabsTrigger>
                      </TabsList>

                      {/* Category Tab */}
                      <TabsContent value="category" className="p-4">
                        <div>
                          <h3 className="font-medium mb-2">Event Categories</h3>
                          <div className="space-y-2">
                            {categories.map((category) => (
                              <div key={category} className="flex items-center">
                                <Checkbox
                                  id={`temp-category-${category}`}
                                  checked={tempCategories.includes(category)}
                                  onCheckedChange={() => toggleTempCategory(category)}
                                />
                                <Label htmlFor={`temp-category-${category}`} className="ml-2 text-sm">
                                  {category}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Location Tab */}
                      <TabsContent value="location" className="p-4">
                        <div>
                          <h3 className="font-medium mb-2">Event Locations</h3>
                          <div className="space-y-2">
                            {locations.map((location) => (
                              <div key={location} className="flex items-center">
                                <Checkbox
                                  id={`temp-location-${location}`}
                                  checked={tempLocations.includes(location)}
                                  onCheckedChange={() => toggleTempLocation(location)}
                                />
                                <Label htmlFor={`temp-location-${location}`} className="ml-2 text-sm">
                                  {location}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Date Tab */}
                      <TabsContent value="date" className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium mb-2">Date Range</h3>
                            <RadioGroup
                              value={tempDatePreset}
                              onValueChange={(value) => {
                                setTempDatePreset(value)
                                applyTempDatePreset(value)
                              }}
                            >
                              {dateRangePresets.map((preset) => (
                                <div key={preset.id} className="flex items-center space-x-2 py-2">
                                  <RadioGroupItem value={preset.id} id={`date-preset-${preset.id}`} />
                                  <Label htmlFor={`date-preset-${preset.id}`}>{preset.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          {tempDatePreset === "custom" && (
                            <div>
                              <h3 className="font-medium mb-2">Custom Date Range</h3>
                              <Calendar
                                mode="range"
                                selected={tempDateRange}
                                onSelect={setTempDateRange as any}
                                className="rounded-md border"
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Audience Tab */}
                      <TabsContent value="audience" className="p-4">
                        <div>
                          <h3 className="font-medium mb-2">Target Audience</h3>
                          <div className="space-y-2">
                            {audiences.map((audience) => (
                              <div key={audience} className="flex items-center">
                                <Checkbox
                                  id={`temp-audience-${audience}`}
                                  checked={tempAudiences.includes(audience)}
                                  onCheckedChange={() => toggleTempAudience(audience)}
                                />
                                <Label htmlFor={`temp-audience-${audience}`} className="ml-2 text-sm">
                                  {audience}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <SheetFooter className="p-4 border-t sticky bottom-0 bg-white z-10 flex flex-row gap-2 justify-between sm:justify-between">
                    <Button variant="outline" onClick={clearTempFilters} className="flex-1">
                      Clear All
                    </Button>
                    <Button onClick={applyFilters} className="flex-1">
                      Apply Filters
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              {/* Enhanced Filter Button - Desktop */}
              <div className="relative hidden md:block">
                <Button
                  id="desktop-filter-button"
                  variant="outline"
                  className="flex items-center gap-2"
                  type="button"
                  onClick={() => setIsDesktopFilterOpen(!isDesktopFilterOpen)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Advanced Filters
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>

                {isDesktopFilterOpen && (
                  <div
                    id="desktop-filter-panel"
                    className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-50 border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Filter Events</h3>
                      <p className="text-sm text-gray-500">Refine events based on your preferences</p>
                    </div>

                    <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                      {/* Categories Section - First */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Categories</h3>
                          {selectedCategories.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCategories([])}
                              className="h-auto py-1 px-2 text-xs"
                              type="button"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <Badge
                              key={category}
                              variant={selectedCategories.includes(category) ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer",
                                selectedCategories.includes(category)
                                  ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                                  : "",
                              )}
                              onClick={() => toggleCategory(category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Locations Section - Second */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Locations</h3>
                          {selectedLocations.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLocations([])}
                              className="h-auto py-1 px-2 text-xs"
                              type="button"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {locations.map((location) => (
                            <div key={location} className="flex items-center">
                              <Checkbox
                                id={`location-${location}`}
                                checked={selectedLocations.includes(location)}
                                onCheckedChange={() => toggleLocation(location)}
                              />
                              <Label htmlFor={`location-${location}`} className="ml-2 text-sm">
                                {location}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Date Range Section - Third */}
                      <div>
                        <h3 className="font-medium mb-3">Date Range</h3>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {dateRangePresets.slice(0, 4).map((preset) => (
                            <Button
                              key={preset.id}
                              variant={selectedDatePreset === preset.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setSelectedDatePreset(preset.id)
                                applyDatePreset(preset.id)
                              }}
                              className={
                                selectedDatePreset === preset.id ? "bg-yellow-400 hover:bg-yellow-500 text-black" : ""
                              }
                              type="button"
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {dateRangePresets.slice(4).map((preset) => (
                            <Button
                              key={preset.id}
                              variant={selectedDatePreset === preset.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setSelectedDatePreset(preset.id)
                                applyDatePreset(preset.id)
                              }}
                              className={
                                selectedDatePreset === preset.id ? "bg-yellow-400 hover:bg-yellow-500 text-black" : ""
                              }
                              type="button"
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                        {selectedDatePreset === "custom" && (
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange as any}
                            className="rounded-md border"
                          />
                        )}
                      </div>

                      <Separator />

                      {/* Target Audience Section - Fourth */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">Target Audience</h3>
                          {selectedAudiences.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAudiences([])}
                              className="h-auto py-1 px-2 text-xs"
                              type="button"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {audiences.map((audience) => (
                            <div key={audience} className="flex items-center">
                              <Checkbox
                                id={`audience-${audience}`}
                                checked={selectedAudiences.includes(audience)}
                                onCheckedChange={() => toggleAudience(audience)}
                              />
                              <Label htmlFor={`audience-${audience}`} className="ml-2 text-sm">
                                {audience}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t flex justify-between">
                      <Button variant="outline" onClick={clearFilters} type="button">
                        Clear All
                      </Button>
                      <Button
                        className="bg-yellow-400 hover:bg-yellow-500 text-black"
                        type="button"
                        onClick={() => setIsDesktopFilterOpen(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategories.length > 0 ||
          selectedLocations.length > 0 ||
          selectedAudiences.length > 0 ||
          dateRange.from ||
          dateRange.to) && (
          <div className="px-4 pb-4 flex flex-wrap gap-2 items-center border-t pt-3">
            <span className="text-sm text-gray-500">Active filters:</span>

            {dateRange.from && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {format(dateRange.from, "MMM d, yyyy")}
                <button
                  className="ml-1 hover:bg-gray-200 rounded-full"
                  onClick={() => setDateRange((prev) => ({ ...prev, from: undefined }))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {dateRange.to && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {format(dateRange.to, "MMM d, yyyy")}
                <button
                  className="ml-1 hover:bg-gray-200 rounded-full"
                  onClick={() => setDateRange((prev) => ({ ...prev, to: undefined }))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedDatePreset !== "custom" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {dateRangePresets.find((p) => p.id === selectedDatePreset)?.label || ""}
                <button
                  className="ml-1 hover:bg-gray-200 rounded-full"
                  onClick={() => {
                    setSelectedDatePreset("custom")
                    setDateRange({ from: undefined, to: undefined })
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedCategories.map((category) => (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                {category}
                <button className="ml-1 hover:bg-gray-200 rounded-full" onClick={() => toggleCategory(category)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {selectedLocations.map((location) => (
              <Badge key={location} variant="secondary" className="flex items-center gap-1">
                {location}
                <button className="ml-1 hover:bg-gray-200 rounded-full" onClick={() => toggleLocation(location)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {selectedAudiences.map((audience) => (
              <Badge key={audience} variant="secondary" className="flex items-center gap-1">
                {audience}
                <button className="ml-1 hover:bg-gray-200 rounded-full" onClick={() => toggleAudience(audience)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            <Button variant="ghost" size="sm" className="text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Display Preferences Indicator */}
        {(!showImages || !showCapacity) && (
          <div className="px-4 pb-3 flex items-center text-sm text-gray-500 border-t pt-3">
            <Settings className="h-3 w-3 mr-1" />
            <span>Display options: </span>
            {!showImages && <span className="ml-1">Images hidden</span>}
            {!showImages && !showCapacity && <span className="mx-1">•</span>}
            {!showCapacity && <span className="ml-1">Capacity hidden</span>}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Showing {currentEvents.length} of {filteredEvents.length} events
        </p>
        <Select value={eventsPerPage.toString()} onValueChange={(value) => setEventsPerPage(Number.parseInt(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Events per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6 per page</SelectItem>
            <SelectItem value="12">12 per page</SelectItem>
            <SelectItem value="24">24 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No events found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
          <Button onClick={clearFilters}>Clear all filters</Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentEvents.map((event) => (
            <Card
              key={event.id}
              className={cn("overflow-hidden hover:shadow-lg transition-shadow duration-300", !showImages && "pt-3")}
            >
              {showImages && (
                <div className="aspect-video relative">
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-medium px-2 py-1 rounded">
                    {event.category}
                  </div>
                  {event.registrations / event.capacity > 0.8 && (
                    <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      Almost Full
                    </div>
                  )}
                </div>
              )}
              <CardHeader className={!showImages ? "pt-2" : ""}>
                {!showImages && (
                  <Badge className="mb-2 bg-yellow-400 text-black hover:bg-yellow-400">{event.category}</Badge>
                )}
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                <CardDescription className="line-clamp-3">{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>
                {showCapacity && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Capacity</span>
                      <span className="text-sm font-medium">
                        {event.registrations}/{event.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          event.registrations / event.capacity > 0.8
                            ? "bg-red-500"
                            : event.registrations / event.capacity > 0.5
                              ? "bg-yellow-500"
                              : "bg-green-500",
                        )}
                        style={{ width: `${(event.registrations / event.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={() => navigateToEvent(event.id)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {currentEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col md:flex-row">
                {showImages ? (
                  <div className="md:w-1/4 relative">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="object-cover w-full h-full min-h-[200px]"
                    />
                    <div className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-medium px-2 py-1 rounded">
                      {event.category}
                    </div>
                    {event.registrations / event.capacity > 0.8 && (
                      <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Almost Full
                      </div>
                    )}
                  </div>
                ) : null}
                <div className={cn("flex flex-col", showImages ? "md:w-3/4" : "w-full")}>
                  <CardHeader>
                    {!showImages && (
                      <Badge className="w-fit mb-2 bg-yellow-400 text-black hover:bg-yellow-400">
                        {event.category}
                      </Badge>
                    )}
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600 col-span-1 md:col-span-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    {showCapacity && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Capacity</span>
                          <span className="text-sm font-medium">
                            {event.registrations}/{event.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              event.registrations / event.capacity > 0.8
                                ? "bg-red-500"
                                : event.registrations / event.capacity > 0.5
                                  ? "bg-yellow-500"
                                  : "bg-green-500",
                            )}
                            style={{ width: `${(event.registrations / event.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button
                      className="bg-yellow-400 hover:bg-yellow-500 text-black"
                      onClick={() => navigateToEvent(event.id)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredEvents.length > 0 && (
        <div className="flex justify-center mt-12">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>

            <div className="flex items-center">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                let pageNumber: number

                // Logic to show correct page numbers when there are many pages
                if (totalPages <= 5) {
                  pageNumber = index + 1
                } else if (currentPage <= 3) {
                  pageNumber = index + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - (4 - index)
                } else {
                  pageNumber = currentPage - 2 + index
                }

                return (
                  <Button
                    key={index}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => paginate(pageNumber)}
                    className={currentPage === pageNumber ? "bg-yellow-400 border-yellow-400" : ""}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
