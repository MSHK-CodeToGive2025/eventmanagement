import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, MapPin, Search, Filter, ChevronLeft, ChevronRight, SortAsc, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ZubinEvent } from "@/types/event-types"
import eventService from "@/services/eventService"

/**
 * Helper function to extract unique categories from events array
 * @param events - Array of ZubinEvent objects
 * @returns Array of unique category strings
 */
const getUniqueCategories = (events: ZubinEvent[]) => {
  const categories = events.map((event) => event.category)
  return [...new Set(categories)]
}

/**
 * EnhancedEventsPage Component
 * Displays a grid of events with search, filter, and pagination functionality
 */
export default function EnhancedEventsPage() {
  // Navigation hook from React Router
  const navigate = useNavigate()

  // State for events data and loading status
  const [events, setEvents] = useState<ZubinEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTargetGroup, setSelectedTargetGroup] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showImages, setShowImages] = useState(true)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [eventsPerPage, setEventsPerPage] = useState(9)

  // Sorting state - options: date-asc, date-desc, title-asc, title-desc
  const [sortBy, setSortBy] = useState<string>("date-asc")

  // Mobile filter visibility state
  const [showFilters, setShowFilters] = useState(false)

  /**
   * Fetch events data on component mount
   * Fetch published, non-private, non-expired events from backend API
   */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch published, non-private, non-expired events from backend
        const fetchedEvents = await eventService.getPublicNonExpiredEvents()
        
        // Transform backend events to match ZubinEvent interface
        const transformedEvents: ZubinEvent[] = fetchedEvents.map(event => ({
          _id: event._id,
          title: event.title,
          description: event.description,
          category: event.category,
          targetGroup: event.targetGroup,
          location: {
            venue: event.location.venue,
            address: event.location.address,
            district: event.location.district,
            onlineEvent: event.location.onlineEvent,
            meetingLink: event.location.meetingLink
          },
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          coverImage: event.coverImage,
          isPrivate: event.isPrivate,
          status: event.status,
          registrationFormId: event.registrationFormId,
          sessions: event.sessions.map(session => ({
            ...session,
            date: new Date(session.date)
          })),
          capacity: event.capacity,
          createdBy: event.createdBy,
          createdAt: new Date(event.createdAt),
          updatedBy: event.updatedBy,
          updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined,
          tags: event.tags,
          registeredCount: event.registeredCount
        }))
        
        setEvents(transformedEvents)
      } catch (error) {
        setError("Failed to fetch events. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Get unique categories, target groups, and locations for filter dropdowns using useMemo for performance
  const categories = useMemo(() => getUniqueCategories(events), [events])
  const targetGroups = useMemo(() => {
    const groups = events.map((event) => event.targetGroup)
    return [...new Set(groups)]
  }, [events])
  const locations = useMemo(() => {
    const locs = events.map((event) => event.location)
    return [...new Set(locs)]
  }, [events])

  /**
   * Filter and sort events based on current filter and sort states
   * Uses useMemo to prevent unnecessary recalculations
   */
  const filteredEvents = useMemo(() => {
    let result = [...events]

    // Apply search filter across title and description
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          (event.description && event.description.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((event) => event.category === selectedCategory)
    }

    // Apply target group filter
    if (selectedTargetGroup) {
      result = result.filter((event) => event.targetGroup === selectedTargetGroup)
    }

    // Apply location filter
    if (selectedLocation) {
      result = result.filter((event) => event.location.venue === selectedLocation)
    }

    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      result = result.filter((event) => new Date(event.startDate) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      result = result.filter((event) => new Date(event.startDate) <= end)
    }

    // Apply sorting based on selected sort option
    switch (sortBy) {
      case "date-asc":
        result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        break
      case "date-desc":
        result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        break
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    return result
  }, [events, searchQuery, selectedCategory, selectedTargetGroup, selectedLocation, startDate, endDate, sortBy])

  // Calculate pagination values
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)
  const indexOfLastEvent = currentPage * eventsPerPage
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent)

  /**
   * Handle page change in pagination
   * @param pageNumber - The page number to navigate to
   */
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /**
   * Reset all filters to their initial state
   */
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSelectedTargetGroup(null)
    setSelectedLocation(null)
    setStartDate(null)
    setEndDate(null)
    setSortBy("date-asc")
    setCurrentPage(1)
  }

  /**
   * Navigate to event detail page
   * @param eventId - The ID of the event to view
   */
  const navigateToEvent = (eventId: string) => {
    const event = events.find(e => e._id === eventId)
    if (event) {
      navigate(`/enhanced-events/${eventId}`, { state: { event } })
    }
  }

  // Check if any filters are currently applied
  const hasActiveFilters = searchQuery || selectedCategory || selectedTargetGroup || selectedLocation || startDate || endDate

  // Error state UI
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Events</h1>
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Loading state UI
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Events</h1>
        {/* Loading skeleton UI */}
        <div className="mb-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        {/* Event card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-t-lg"></div>
              <div className="p-4 border border-gray-200 rounded-b-lg">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {/* <h1 className="text-3xl font-bold mb-6">Enhanced Events</h1> */}
      <div className=" mb-8">
        <h1 className="text-3xl font-bold mb-4">Upcoming Zubin Events</h1>
        <p className="text-gray-600 mx-auto ">
          Discover and register for events organized by The Zubin Foundation to support ethnic minorities in Hong Kong.
        </p>
      </div>

      {/* Desktop Search and Filter Section */}
      <div className="hidden md:block mb-6 space-y-4">
        {/* Search and Sort Row */}
        <div className="flex gap-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search events by title or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date (Earliest)</SelectItem>
              <SelectItem value="date-desc">Date (Latest)</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category Filter */}
          <div className="w-[180px]">
            <Select
              value={selectedCategory || ""}
              onValueChange={(value) => {
                setSelectedCategory(value === "all" ? null : value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Group Filter */}
          <div className="w-[180px]">
            <Select
              value={selectedTargetGroup || ""}
              onValueChange={(value) => {
                setSelectedTargetGroup(value === "all" ? null : value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Target Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Target Groups</SelectItem>
                {targetGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="w-[180px]">
            <Select
              value={selectedLocation || ""}
              onValueChange={(value) => {
                setSelectedLocation(value === "all" ? null : value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.venue} value={location.venue}>
                    {location.venue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Label htmlFor="start-date" className="mr-2">
                Start:
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null
                  setStartDate(date)
                  setCurrentPage(1)
                }}
                className="w-auto"
              />
            </div>

            <div className="flex items-center">
              <Label htmlFor="end-date" className="mr-2">
                End:
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null
                  setEndDate(date)
                  setCurrentPage(1)
                }}
                className="w-auto"
              />
            </div>
          </div>

          {/* Show Images Toggle */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-images" className="text-sm">Show Images</Label>
            <input
              type="checkbox"
              id="show-images"
              checked={showImages}
              onChange={(e) => setShowImages(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="ghost" onClick={resetFilters} className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Search Filter Badge */}
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchQuery}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setSearchQuery("")
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {/* Category Filter Badge */}
            {selectedCategory && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {selectedCategory}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {/* Target Group Filter Badge */}
            {selectedTargetGroup && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Target Group: {selectedTargetGroup}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setSelectedTargetGroup(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {/* Location Filter Badge */}
            {selectedLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Location: {selectedLocation}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setSelectedLocation(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {/* Date Range Filter Badges */}
            {startDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {format(startDate, "MMM dd, yyyy")}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setStartDate(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {format(endDate, "MMM dd, yyyy")}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setEndDate(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Mobile Search and Filter Section */}
      <div className="md:hidden mb-6 space-y-4">
        {/* Mobile Search and Filter Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-yellow-100 text-yellow-700" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Mobile Category Filter */}
            <div>
              <Label htmlFor="mobile-category">Category</Label>
              <Select
                value={selectedCategory || ""}
                onValueChange={(value) => {
                  setSelectedCategory(value === "all" ? null : value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger id="mobile-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Target Group Filter */}
            <div>
              <Label htmlFor="mobile-target-group">Target Group</Label>
              <Select
                value={selectedTargetGroup || ""}
                onValueChange={(value) => {
                  setSelectedTargetGroup(value === "all" ? null : value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger id="mobile-target-group">
                  <SelectValue placeholder="All Target Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Target Groups</SelectItem>
                  {targetGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Location Filter */}
            <div>
              <Label htmlFor="mobile-location">Location</Label>
              <Select
                value={selectedLocation || ""}
                onValueChange={(value) => {
                  setSelectedLocation(value === "all" ? null : value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger id="mobile-location">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.venue} value={location.venue}>
                      {location.venue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Date Range Filter */}
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null
                      setStartDate(date)
                      setCurrentPage(1)
                    }}
                    className="text-xs h-9"
                    placeholder="Start Date"
                  />
                </div>

                <div className="flex-1">
                  <Input
                    type="date"
                    value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null
                      setEndDate(date)
                      setCurrentPage(1)
                    }}
                    className="text-xs h-9"
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Sort Filter */}
            <div>
              <Label htmlFor="mobile-sort">Sort By</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                <SelectTrigger id="mobile-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                  <SelectItem value="date-desc">Date (Latest)</SelectItem>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Show Images Toggle */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="mobile-show-images" className="text-sm">Show Images</Label>
              <input
                type="checkbox"
                id="mobile-show-images"
                checked={showImages}
                onChange={(e) => setShowImages(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
            </div>

            {/* Mobile Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Mobile Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCategory && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                {selectedCategory}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {selectedTargetGroup && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Target Group: {selectedTargetGroup}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setSelectedTargetGroup(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {selectedLocation && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Location: {selectedLocation}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setSelectedLocation(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {startDate && endDate && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                {format(startDate, "MM/dd")} - {format(endDate, "MM/dd")}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setStartDate(null)
                    setEndDate(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {startDate && !endDate && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                From: {format(startDate, "MM/dd")}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setStartDate(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
            {!startDate && endDate && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                Until: {format(endDate, "MM/dd")}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => {
                    setEndDate(null)
                    setCurrentPage(1)
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {currentEvents.length} of {filteredEvents.length} events
        {hasActiveFilters && " (filtered)"}
      </div>

      {/* Events Grid */}
      {currentEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentEvents.map((event) => (
            <Card key={event._id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Event Image */}
              {showImages && (
                <div className="relative aspect-square">
                  <img
                    src={eventService.getEventImageUrl(event._id, event) || "/placeholder.svg?height=400&width=400&query=event"}
                    alt={event.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              {/* Event Details */}
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2 line-clamp-1">{event.title}</h2>
                <div className="space-y-2 mb-4">
                  {/* Event Date Range */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Event Location */}
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location.venue}</span>
                  </div>
                </div>
                {/* Event Tags and Button - Horizontal Layout */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      {event.category}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {event.targetGroup}
                    </span>
                  </div>
                  <Button
                    onClick={() => navigateToEvent(event._id)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // No Results State
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">No events found matching your criteria</div>
          <Button onClick={resetFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            {/* Previous Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first page, last page, current page, and pages around current page
                  return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                })
                .map((page, index, array) => {
                  // Add ellipsis
                  const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1
                  const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsisBefore && <span className="px-2">...</span>}

                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(page)}
                        className={currentPage === page ? "bg-yellow-400 hover:bg-yellow-500 text-black" : ""}
                      >
                        {page}
                      </Button>

                      {showEllipsisAfter && <span className="px-2">...</span>}
                    </div>
                  )
                })}
            </div>

            {/* Next Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Events Per Page Selector */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Show</span>
          <Select
            value={eventsPerPage.toString()}
            onValueChange={(value) => {
              setEventsPerPage(Number.parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue placeholder="9" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="9">9</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
            </SelectContent>
          </Select>
          <span>events per page</span>
        </div>
      </div>
    </div>
  )
}
