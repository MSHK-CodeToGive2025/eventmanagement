import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, MapPin, Search, Filter, ChevronLeft, ChevronRight, SortAsc, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { ZubinEvent } from "@/types/enhanced-event-types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { enhancedEvents } from "@/types/mock-enhanced-event-data"

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

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [eventsPerPage, setEventsPerPage] = useState(9)

  // Sorting state - options: date-asc, date-desc, title-asc, title-desc, capacity-asc, capacity-desc
  const [sortBy, setSortBy] = useState<string>("date-asc")

  // Mobile filter visibility state
  const [showFilters, setShowFilters] = useState(false)

  /**
   * Fetch events data on component mount
   * Currently using mock data, but can be replaced with API call
   */
  useEffect(() => {
    const fetchEvents = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API delay
      setEvents(enhancedEvents)
      setLoading(false)
    }

    fetchEvents()
  }, [])

  // Get unique categories for filter dropdown using useMemo for performance
  const categories = useMemo(() => getUniqueCategories(events), [events])

  /**
   * Filter and sort events based on current filter and sort states
   * Uses useMemo to prevent unnecessary recalculations
   */
  const filteredEvents = useMemo(() => {
    let result = [...events]

    // Apply search filter across title, details, and location
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (event) =>
          event.eventTitle.toLowerCase().includes(query) ||
          (event.eventDetails && event.eventDetails.toLowerCase().includes(query)) ||
          event.location.toLowerCase().includes(query),
      )
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((event) => event.category === selectedCategory)
    }

    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      result = result.filter((event) => new Date(event.date) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      result = result.filter((event) => new Date(event.date) <= end)
    }

    // Apply sorting based on selected sort option
    switch (sortBy) {
      case "date-asc":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "date-desc":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case "title-asc":
        result.sort((a, b) => a.eventTitle.localeCompare(b.eventTitle))
        break
      case "title-desc":
        result.sort((a, b) => b.eventTitle.localeCompare(a.eventTitle))
        break
      case "capacity-asc":
        result.sort((a, b) => a.capacity - b.capacity)
        break
      case "capacity-desc":
        result.sort((a, b) => b.capacity - a.capacity)
        break
    }

    return result
  }, [events, searchQuery, selectedCategory, startDate, endDate, sortBy])

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
    navigate(`/enhanced-events/${eventId}`)
  }

  // Check if any filters are currently applied
  const hasActiveFilters = searchQuery || selectedCategory || startDate || endDate

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
              <div className="bg-gray-200 h-48 rounded-t-lg"></div>
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
        <h1 className="text-3xl font-bold mb-4">Upcoming Events</h1>
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
              placeholder="Search events by title, description or location..."
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
              <SelectItem value="capacity-asc">Capacity (Low-High)</SelectItem>
              <SelectItem value="capacity-desc">Capacity (High-Low)</SelectItem>
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
                setSelectedCategory(value || null)
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
                  setSelectedCategory(value || null)
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
                  <SelectItem value="capacity-asc">Capacity (Low-High)</SelectItem>
                  <SelectItem value="capacity-desc">Capacity (High-Low)</SelectItem>
                </SelectContent>
              </Select>
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
            <Card key={event.eventId} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Event Image */}
              <div className="relative h-48">
                <img
                  src={event.imageUrl || "/placeholder.svg?height=200&width=400&query=event"}
                  alt={event.eventTitle}
                  className="object-cover w-full h-full"
                />
              </div>
              {/* Event Details */}
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2 line-clamp-1">{event.eventTitle}</h2>
                <div className="space-y-2 mb-4">
                  {/* Event Date */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  {/* Event Time */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                  {/* Event Location */}
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>
                {/* Event Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      {event.category}
                    </span>
                  </div>
                  <Button
                    onClick={() => navigateToEvent(event.eventId)}
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
