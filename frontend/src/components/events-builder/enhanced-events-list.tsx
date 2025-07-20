import { useState, useEffect } from "react"
import { format } from "date-fns"
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
  Users,
  Eye,
} from "lucide-react"
import { ZubinEvent, eventCategories, targetGroups, eventStatuses } from "@/types/event-types"
// import { mockZubinEvents } from "@/types/mock-enhanced-event-data"
import { useNavigate } from "react-router-dom"
import eventService from "@/services/eventService"
import { useToast } from "@/hooks/use-toast"

// Define the interface for the filter state
interface FilterState {
  location: string;
  category: string[];
  targetGroup: string[];
  status: string[];
  registrationForm: string[];
  isPrivate: boolean | null;
  lastUpdatedBy: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

interface EnhancedEventsListProps {
  onEditEvent: (eventId: string) => void;
  refreshTrigger?: number;
}

export default function EnhancedEventsList({ onEditEvent, refreshTrigger }: EnhancedEventsListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for events data
  const [events, setEvents] = useState<ZubinEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  // State for search, filters, sorting, and pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    location: "",
    category: [],
    targetGroup: [],
    status: [],
    registrationForm: [],
    isPrivate: null,
    lastUpdatedBy: "",
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

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const eventsData = await eventService.getEvents()
      // Transform backend data to match ZubinEvent interface
      const transformedEvents: ZubinEvent[] = eventsData.map((event: any) => ({
        _id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        targetGroup: event.targetGroup,
        location: event.location,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
                    coverImage: event.coverImage,
        isPrivate: event.isPrivate,
        status: event.status,
        registrationFormId: event.registrationFormId,
        sessions: event.sessions.map((session: any) => ({
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
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load events on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchEvents()
  }, [refreshTrigger])

  // Reset pagination when filters or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  // Update active filters for the filter badges
  useEffect(() => {
    const newActiveFilters: string[] = []

    if (filters.location) newActiveFilters.push("Location")
    if (filters.category.length > 0) newActiveFilters.push("Category")
    if (filters.targetGroup.length > 0) newActiveFilters.push("Target Group")
    if (filters.status.length > 0) newActiveFilters.push("Status")
    if (filters.registrationForm.length > 0) newActiveFilters.push("Form")
    if (filters.isPrivate !== null) newActiveFilters.push("Private Status")
    if (filters.lastUpdatedBy) newActiveFilters.push("Last Updated By")
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
      location: "",
      category: [],
      targetGroup: [],
      status: [],
      registrationForm: [],
      isPrivate: null,
      lastUpdatedBy: "",
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
      case "Private Status":
        setFilters((prev) => ({ ...prev, isPrivate: null }))
        break
      case "Last Updated By":
        setFilters((prev) => ({ ...prev, lastUpdatedBy: "" }))
        break
      case "Date Range":
        setFilters((prev) => ({ ...prev, dateRange: { from: null, to: null } }))
        break
      default:
        break
    }
  }

  // Filter events based on all filters and search query
  const filteredEvents = events.filter((event) => {
    // Global search only for title
    const matchesSearch = searchQuery
      ? event.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true

    // Specific field filters
    const matchesLocation = filters.location
      ? event.location.venue.toLowerCase().includes(filters.location.toLowerCase())
      : true

    const matchesCategory = filters.category.length > 0 ? filters.category.includes(event.category) : true

    const matchesTargetGroup = filters.targetGroup.length > 0 ? filters.targetGroup.includes(event.targetGroup) : true

    const matchesStatus = filters.status.length > 0 ? filters.status.includes(event.status) : true

    const matchesForm =
      filters.registrationForm.length > 0 ? filters.registrationForm.includes(event.registrationFormId) : true

    const matchesIsPrivate = filters.isPrivate !== null ? event.isPrivate === filters.isPrivate : true;

    const matchesLastUpdatedBy = filters.lastUpdatedBy
      ? (event.updatedBy?.firstName?.toLowerCase().includes(filters.lastUpdatedBy.toLowerCase()) || 
         event.updatedBy?.lastName?.toLowerCase().includes(filters.lastUpdatedBy.toLowerCase()) || false)
      : true;

    // Date range filter
    let matchesDateRange = true
    if (filters.dateRange.from || filters.dateRange.to) {
      if (filters.dateRange.from && filters.dateRange.to) {
        matchesDateRange = event.startDate >= filters.dateRange.from && event.endDate <= filters.dateRange.to
      } else if (filters.dateRange.from) {
        matchesDateRange = event.startDate >= filters.dateRange.from
      } else if (filters.dateRange.to) {
        matchesDateRange = event.endDate <= filters.dateRange.to
      }
    }

    return (
      matchesSearch &&
      matchesLocation &&
      matchesCategory &&
      matchesTargetGroup &&
      matchesStatus &&
      matchesForm &&
      matchesDateRange &&
      matchesIsPrivate &&
      matchesLastUpdatedBy
    )
  })

  // Sort the filtered events
  const sortedEvents = [...filteredEvents]
  if (sortConfig) {
    sortedEvents.sort((a, b) => {
      if (sortConfig.key === "date") {
        return sortConfig.direction === "ascending"
          ? a.startDate.getTime() - b.startDate.getTime()
          : b.startDate.getTime() - a.startDate.getTime()
      }

      if (sortConfig.key === "title") {
        return sortConfig.direction === "ascending"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      }

      if (sortConfig.key === "location") {
        return sortConfig.direction === "ascending"
          ? a.location.venue.localeCompare(b.location.venue)
          : b.location.venue.localeCompare(a.location.venue)
      }

      if (sortConfig.key === "category") {
        return sortConfig.direction === "ascending"
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category)
      }

      if (sortConfig.key === "targetGroup") {
        return sortConfig.direction === "ascending"
          ? a.targetGroup.localeCompare(b.targetGroup)
          : b.targetGroup.localeCompare(a.targetGroup)
      }

      if (sortConfig.key === "status") {
        return sortConfig.direction === "ascending"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      }

      if (sortConfig.key === "capacity") {
        return sortConfig.direction === "ascending"
          ? (a.capacity || 0) - (b.capacity || 0)
          : (b.capacity || 0) - (a.capacity || 0)
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

  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      try {
        await eventService.deleteEvent(eventToDelete)
        setEvents(events.filter((event) => event._id !== eventToDelete))
        toast({
          title: "Event deleted",
          description: "The event has been deleted successfully",
        })
      } catch (error: any) {
        console.error("Error deleting event:", error)
        let errorMessage = "Failed to delete event"
        
        // Provide more specific error messages
        if (error.message?.includes("403")) {
          errorMessage = "Access denied. Only administrators can delete events."
        } else if (error.message?.includes("401")) {
          errorMessage = "Authentication required. Please log in again."
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setDeleteDialogOpen(false)
        setEventToDelete(null)
      }
    }
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
              placeholder="Search events by title..."
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

                {/* Private Event Filter */}
                <div className="space-y-2">
                  <Label>Private Event</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="private-yes"
                        checked={filters.isPrivate === true}
                        onCheckedChange={(checked) => {
                          setFilters((prev) => ({
                            ...prev,
                            isPrivate: checked ? true : null,
                          }));
                        }}
                      />
                      <Label htmlFor="private-yes">Private</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="private-no"
                        checked={filters.isPrivate === false}
                        onCheckedChange={(checked) => {
                          setFilters((prev) => ({
                            ...prev,
                            isPrivate: checked ? false : null,
                          }));
                        }}
                      />
                      <Label htmlFor="private-no">Public</Label>
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {eventCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.category.includes(category)}
                          onCheckedChange={() => handleCheckboxFilterChange("category", category)}
                        />
                        <Label htmlFor={`category-${category}`} className="cursor-pointer text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Group Filter */}
                <div className="space-y-2">
                  <Label>Target Group</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {targetGroups.map((group) => (
                      <div key={group} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`target-${group}`}
                          checked={filters.targetGroup.includes(group)}
                          onCheckedChange={() => handleCheckboxFilterChange("targetGroup", group)}
                        />
                        <Label htmlFor={`target-${group}`} className="cursor-pointer text-sm">
                          {group}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {eventStatuses.map((status) => (
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

                {/* Last Updated By Filter */}
                <div className="space-y-2">
                  <Label htmlFor="last-updated-by-filter">Last Updated By</Label>
                  <Input
                    id="last-updated-by-filter"
                    placeholder="Filter by user"
                    value={filters.lastUpdatedBy}
                    onChange={(e) => handleFilterChange("lastUpdatedBy", e.target.value)}
                  />
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
      {loading ? (
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 bg-gray-100 animate-pulse rounded"></div>
          ))}
        </div>
      ) : (
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
                  Start Date & Sessions
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
              <TableHead className="cursor-pointer" onClick={() => handleSort("isPrivate")}>
                <div className="flex items-center">
                  Private Event
                  {sortConfig?.key === "isPrivate" &&
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
              <TableHead className="cursor-pointer" onClick={() => handleSort("updatedBy")}>
                <div className="flex items-center">
                  Last Updated By
                  {sortConfig?.key === "updatedBy" &&
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
                <TableRow key={event._id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                        {format(event.startDate, "MMM d, yyyy")}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {event.sessions.length} session{event.sessions.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      {event.location.onlineEvent ? "Online" : event.location.venue}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-gray-500" />
                      <Badge variant="outline" className="bg-gray-50">
                        {event.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge variant={event.isPrivate ? "default" : "outline"} className={event.isPrivate ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}>
                        {event.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.status === "Published"
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
                          : event.status === "Draft"
                            ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            : event.status === "Cancelled"
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                      }
                    >
                      <div className="flex items-center">
                        {event.status === "Published" ? (
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
                      <span className="text-sm">
                        {event.updatedBy 
                          ? `${event.updatedBy.firstName} ${event.updatedBy.lastName}`
                          : event.createdBy 
                            ? `${event.createdBy.firstName} ${event.createdBy.lastName}`
                            : "Unknown"
                        }
                      </span>
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
                        <DropdownMenuItem onClick={() => {
                          console.log('Viewing event:', event._id, event.title);
                          navigate(`/enhanced-events/${event._id}`);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditEvent(event._id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/manage/events/${event._id}/registrations`, { state: { event } })}>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Registrations
                        </DropdownMenuItem>
                        {/* 
                        <DropdownMenuItem
                          onClick={() => (window.location.href = `/manage/events/${event._id}/reminders`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send WhatsApp Reminders
                        </DropdownMenuItem>
                        */}
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(event._id)}>
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
      )}

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
