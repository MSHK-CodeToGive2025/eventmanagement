import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Search, Eye, X, Loader2, ArrowLeft, ChevronDown, ChevronUp, Clock, FileText, User, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import registrationService, { EventRegistration } from "@/services/registrationService"
import { formService } from "@/services/formService"
import { RegistrationForm } from "@/types/form-types"
import { useToast } from "@/hooks/use-toast"
import RouteGuard from "@/components/route-guard"
import { Separator } from "@/components/ui/separator"

export default function MyRegistrations() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [forms, setForms] = useState<Record<string, RegistrationForm>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "registered" | "cancelled" | "rejected">("all")
  const [expandedRegistrations, setExpandedRegistrations] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await registrationService.getMyRegistrations()
        setRegistrations(data)
        
        // Fetch forms for all registrations
        const formIds = new Set<string>()
        data.forEach(registration => {
          const event = registration.eventId as any
          if (event?.registrationFormId) {
            formIds.add(event.registrationFormId)
          }
        })
        
        // Fetch all forms
        const formsData: Record<string, RegistrationForm> = {}
        for (const formId of formIds) {
          try {
            const form = await formService.getForm(formId)
            formsData[formId] = form
          } catch (err) {
            console.error(`Error fetching form ${formId}:`, err)
          }
        }
        
        setForms(formsData)
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
      case "registered":
        return "default"
      case "cancelled":
        return "destructive"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusClassName = (status: EventRegistration['status']) => {
    switch (status) {
      case "registered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const toggleExpanded = (registrationId: string) => {
    setExpandedRegistrations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(registrationId)) {
        newSet.delete(registrationId)
      } else {
        newSet.add(registrationId)
      }
      return newSet
    })
  }

  const isExpanded = (registrationId: string) => expandedRegistrations.has(registrationId)

  const getRegisteredSessions = (registration: EventRegistration, event: any) => {
    if (!registration.sessions || registration.sessions.length === 0) return []
    if (!event.sessions || event.sessions.length === 0) return []
    
    return event.sessions.filter((session: any) => 
      registration.sessions.includes(session._id)
    )
  }

  const formatFormResponse = (response: any) => {
    if (typeof response === 'boolean') {
      return response ? 'Yes' : 'No'
    }
    if (Array.isArray(response)) {
      return response.join(', ')
    }
    return response || 'Not provided'
  }

  const getFieldLabel = (fieldId: string, event: any): string => {
    if (!event?.registrationFormId || !forms[event.registrationFormId]) {
      return fieldId // Fallback to field ID if form not found
    }
    
    const form = forms[event.registrationFormId]
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field._id === fieldId) {
          return field.label
        }
      }
    }
    return fieldId // Fallback to field ID if field not found
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
                <option value="registered">Registered</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
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

              const registeredSessions = getRegisteredSessions(registration, event)
              const isExpandedState = isExpanded(registration._id)

              return (
                <Card key={registration._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Main Registration Info */}
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
                              {registeredSessions.length > 0 && (
                                <Badge variant="outline" className="bg-blue-50">
                                  {registeredSessions.length} session{registeredSessions.length > 1 ? 's' : ''}
                                </Badge>
                              )}
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
                          onClick={() => toggleExpanded(registration._id)}
                        >
                          {isExpandedState ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              View Details
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/enhanced-events/${event._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Event
                        </Button>
                        {registration.status !== "cancelled" && registration.status !== "rejected" && (
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

                    {/* Expanded Details */}
                    {isExpandedState && (
                      <div className="mt-6 space-y-6">
                        <Separator />
                        
                        {/* Registered Sessions */}
                        <div>
                          <div className="flex items-center mb-3">
                            <Clock className="h-4 w-4 mr-2 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Registered Sessions</h4>
                          </div>
                          {registeredSessions.length > 0 ? (
                            <div className="grid gap-3">
                              {registeredSessions.map((session: any) => (
                                <Card key={session._id} className="bg-blue-50 border-blue-200">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h5 className="font-medium text-blue-900 mb-1">{session.title}</h5>
                                        {session.description && (
                                          <p className="text-sm text-blue-700 mb-2">{session.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-sm text-blue-600">
                                          <div className="flex items-center">
                                            <CalendarIcon className="h-3 w-3 mr-1" />
                                            <span>{format(new Date(session.date), "MMM d, yyyy")}</span>
                                          </div>
                                          <div className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            <span>{session.startTime} - {session.endTime}</span>
                                          </div>
                                          {session.location?.venue && (
                                            <div className="flex items-center">
                                              <MapPin className="h-3 w-3 mr-1" />
                                              <span>{session.location.venue}</span>
                                            </div>
                                          )}
                                          {session.capacity && (
                                            <div className="flex items-center">
                                              <Users className="h-3 w-3 mr-1" />
                                              <span>Capacity: {session.capacity}</span>
                                            </div>
                                          )}
                                        </div>
                                        {session.location?.meetingLink && (
                                          <div className="mt-2">
                                            <a 
                                              href={session.location.meetingLink} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                                            >
                                              Join Online Meeting
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                              <p className="text-gray-600">No sessions registered for this event.</p>
                            </div>
                          )}
                        </div>

                        {/* Registration Form Responses */}
                        {registration.formResponses && registration.formResponses.length > 0 && (
                          <div>
                            <div className="flex items-center mb-3">
                              <FileText className="h-4 w-4 mr-2 text-green-600" />
                              <h4 className="font-semibold text-gray-900">Registration Form Responses</h4>
                            </div>
                            <div className="grid gap-3">
                              {registration.formResponses.map((response, index) => (
                                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-green-800 mb-1">
                                        {getFieldLabel(response.fieldId, event)}
                                      </p>
                                      <p className="text-sm text-green-700">
                                        {formatFormResponse(response.response)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Attendee Information */}
                        <div>
                          <div className="flex items-center mb-3">
                            <User className="h-4 w-4 mr-2 text-purple-600" />
                            <h4 className="font-semibold text-gray-900">Attendee Information</h4>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-purple-800 mb-1">Name</p>
                                <p className="text-sm text-purple-700">
                                  {registration.attendee.firstName} {registration.attendee.lastName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-purple-800 mb-1">Phone</p>
                                <p className="text-sm text-purple-700">{registration.attendee.phone}</p>
                              </div>
                              {registration.attendee.email && (
                                <div>
                                  <p className="text-sm font-medium text-purple-800 mb-1">Email</p>
                                  <p className="text-sm text-purple-700">{registration.attendee.email}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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