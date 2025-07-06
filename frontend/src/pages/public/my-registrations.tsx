import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Search, Eye, X, Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import registrationService, { EventRegistration } from "@/services/registrationService"
import { useToast } from "@/hooks/use-toast"
import RouteGuard from "@/components/route-guard"

export default function MyRegistrations() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "attended" | "cancelled" | "waitlisted">("all")

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await registrationService.getMyRegistrations()
        setRegistrations(data)
      } catch (err: any) {
        console.error('Error fetching registrations:', err)
        setError(err.message || 'Failed to load registrations')
        toast({
          title: "Error",
          description: err.message || "Failed to load registrations",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [toast])

  // Filter registrations based on search query and status
  const filteredRegistrations = registrations.filter((registration) => {
    const event = registration.eventId as any // Backend populates this
    if (!event) return false
    
    const searchString = `${event.title} ${event.category} ${event.targetGroup}`.toLowerCase()
    const matchesSearch = searchString.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCancelRegistration = async (registrationId: string) => {
    try {
      await registrationService.cancelRegistration(registrationId)
      
      // Update local state
      setRegistrations(prev => prev.map(reg =>
        reg._id === registrationId
          ? { ...reg, status: 'cancelled' as const }
          : reg
      ))
      
      toast({
        title: "Success",
        description: "Registration cancelled successfully",
      })
    } catch (err: any) {
      console.error('Error cancelling registration:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to cancel registration",
        variant: "destructive",
      })
    }
  }

  const getStatusVariant = (status: EventRegistration['status']) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "outline"
      case "cancelled":
        return "destructive"
      case "attended":
        return "default"
      case "waitlisted":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusClassName = (status: EventRegistration['status']) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "attended":
        return "bg-blue-100 text-blue-800"
      case "waitlisted":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading your registrations...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    )
  }

  return (
    <RouteGuard>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold">My Event Registrations</h1>
            <p className="text-gray-600 mt-2">
              View and manage your event registrations
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="attended">Attended</option>
                <option value="cancelled">Cancelled</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </div>
          </CardHeader>
        </Card>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {registrations.length === 0 ? (
                <div>
                  <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
                  <Button 
                    onClick={() => navigate("/enhanced-events")}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    Browse Events
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">No registrations match your search criteria.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredRegistrations.map((registration) => {
              const event = registration.eventId as any // Backend populates this
              if (!event) return null

              return (
                <Card key={registration._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>
                                  {format(new Date(event.startDate), "MMM d, yyyy")}
                                  {event.startDate !== event.endDate && 
                                    ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`
                                  }
                                </span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{event.location?.venue || "Location TBD"}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="outline" className="bg-gray-50">
                                {event.category}
                              </Badge>
                              <Badge variant="outline" className="bg-gray-50">
                                {event.targetGroup}
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            variant={getStatusVariant(registration.status)}
                            className={getStatusClassName(registration.status)}
                          >
                            {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>Registered on: {format(new Date(registration.registeredAt), "MMM d, yyyy 'at' h:mm a")}</p>
                          {registration.cancelledAt && (
                            <p>Cancelled on: {format(new Date(registration.cancelledAt), "MMM d, yyyy 'at' h:mm a")}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/enhanced-events/${event._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Event
                        </Button>
                        {registration.status !== "cancelled" && registration.status !== "attended" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelRegistration(registration._id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </RouteGuard>
  )
} 