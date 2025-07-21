import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, Share2, Calendar, MapPin, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ZubinEvent } from "@/types/event-types"
import { RegistrationForm } from "@/types/form-types"
import eventService from "@/services/eventService"
import { formService } from "@/services/formService"

// Simple interface for event registration
interface EventRegistration {
  _id: string;
  eventId: string;
  userId: string;
  attendee: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  sessions: string[];
  formResponses: Array<{
    sectionId: string;
    fieldId: string;
    response: any;
  }>;
  status: string;
  registeredAt: Date;
}
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EnhancedEventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [event, setEvent] = useState<ZubinEvent | null>(null)
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { isAuthenticated, user } = useAuth()

  // Form state
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (typeof id !== "string") {
          throw new Error("Invalid event ID")
        }

        // Get event data from location state or fetch it
        const eventData = location.state?.event || await eventService.getEvent(id)
        if (!eventData) {
          navigate("/events/not-found")
          return
        }

        setEvent(eventData)

        // Fetch registration form
        try {
          const formData = await formService.getForm(eventData.registrationFormId)
          setRegistrationForm(formData)
        } catch (error) {
          console.error("Error fetching registration form:", error)
          // Continue without registration form
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        console.log("Failed to load event details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [id, navigate, location.state])

  const handleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId)
      } else {
        return [...prev, sessionId]
      }
    })
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }))
    // Clear error when field is edited
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    if (!registrationForm) return false

    const newErrors: Record<string, string> = {}
    let isValid = true

    // Validate session selection
    if (selectedSessions.length === 0) {
      newErrors.sessions = "Please select at least one session"
      isValid = false
    }

    // Validate form fields
    registrationForm.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !formValues[field._id]) {
          newErrors[field._id] = `${field.label} is required`
          isValid = false
        }
      })
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!event || !registrationForm || !user) return

    if (!validateForm()) {
      console.log("Please correct the errors in the form before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      // Call backend to save registration
      await eventService.registerForEventV2(event._id, {
        sessions: selectedSessions,
        formResponses: Object.entries(formValues).map(([fieldId, response]) => ({
          sectionId: registrationForm.sections.find(section => 
            section.fields.some(field => field._id === fieldId)
          )?._id || "",
          fieldId,
          response
        })),
        attendee: {
          firstName: formValues.firstName || user.firstName,
          lastName: formValues.lastName || user.lastName,
          phone: formValues.phone || user.mobile || "",
          email: formValues.email || user.email
        }
      })
      setRegistrationComplete(true)
    } catch (error: any) {
      console.error("Error submitting form:", error)
      alert(error.response?.data?.message || "There was an unexpected error. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedSessions([])
    setFormValues({})
    setErrors({})
    setRegistrationComplete(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
            <div>
              <div className="bg-gray-200 h-40 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-40 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/events")}>Browse All Events</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Event Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
        <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            <span>
              {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{event.location.venue}, {event.location.district}</span>
          </div>
          {/*
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <span>
              {event.registeredCount || 0}/{event.capacity || 0} registered
            </span>
          </div>
          */}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
            {event.category}
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
            {event.targetGroup}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardContent className="p-0">
              {event.coverImage && (
                <div className="relative w-full h-64 sm:h-80">
                  <img
                    src={eventService.getEventImageUrl(event._id, event)}
                    alt={event.title}
                    className="object-cover w-full h-full rounded-t-lg"
                  />
                </div>
              )}
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="overview" className="flex-1">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="flex-1">
                      Sessions
                    </TabsTrigger>
                    <TabsTrigger
                      value="registration"
                      className="flex-1 bg-yellow-50 data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                    >
                      Registration
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sessions" className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Event Sessions</h2>
                    <p className="text-gray-700 mb-6">
                      Please select the session(s) you wish to attend.
                    </p>

                    <div className="space-y-4">
                      {event.sessions.map((session) => (
                        <Card key={session._id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold mb-2">{session.title}</h3>
                                {session.description && (
                                  <p className="text-gray-600 mb-2">{session.description}</p>
                                )}
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span>{new Date(session.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Clock className="h-4 w-4 mr-2" />
                                  <span>{session.startTime} - {session.endTime}</span>
                                </div>
                                {session.location?.venue && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span>{session.location.venue}</span>
                                  </div>
                                )}
                              </div>
                              <Checkbox
                                id={session._id}
                                checked={selectedSessions.includes(session._id)}
                                onCheckedChange={() => handleSessionSelection(session._id)}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="registration">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold mb-2">Registration Information</h2>
                      <p className="text-gray-700 mb-6">
                        Please fill in the registration form. 
                      </p>

                      {!isAuthenticated ? (
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                          <h3 className="text-lg font-semibold mb-3">Sign In Required</h3>
                          <p className="text-gray-700 mb-4">You need to be logged in to register for this event.</p>
                          <div className="flex justify-center gap-4">
                            <Button onClick={() => navigate("/login")} variant="outline">
                              Sign In
                            </Button>
                            <Button
                              onClick={() => navigate("/sign-up")}
                              className="bg-yellow-400 hover:bg-yellow-500 text-black"
                            >
                              Sign Up
                            </Button>
                          </div>
                        </div>
                      ) : event.registeredCount && event.capacity && event.registeredCount >= event.capacity ? (
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                          <h3 className="text-lg font-semibold mb-3">Event Full</h3>
                          <p className="text-gray-700 mb-4">
                            This event has reached its capacity. Please check back later or explore other events.
                          </p>
                          <Button onClick={() => navigate("/enhanced-events")} variant="outline">
                            Browse Other Events
                          </Button>
                        </div>
                      ) : registrationComplete ? (
                        <div className="bg-green-50 p-6 rounded-lg text-center">
                          <h3 className="text-lg font-semibold mb-3 text-green-700">Registration Complete!</h3>
                          <p className="text-gray-700 mb-4">
                            Thank you for registering for this event. 
                          </p>
                          <div className="flex justify-center gap-4">
                            <Button onClick={() => navigate("/enhanced-events")} variant="outline">
                              Browse Other Events
                            </Button>
                            {/*
                            <Button onClick={resetForm} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                              Register Another Person
                            </Button>
                            */}
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {errors.sessions && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{errors.sessions}</AlertDescription>
                            </Alert>
                          )}

                          {registrationForm?.sections.map((section) => (
                            <div key={section._id} className="space-y-4">
                              <h3 className="text-lg font-semibold">{section.title}</h3>
                              {section.description && (
                                <p className="text-gray-600">{section.description}</p>
                              )}
                              {section.fields.map((field) => (
                                <div key={field._id} className="space-y-2">
                                  <Label htmlFor={field._id}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </Label>
                                  {field.helpText && (
                                    <p className="text-sm text-gray-500">{field.helpText}</p>
                                  )}
                                  {field.type === "text" && (
                                    <Input
                                      id={field._id}
                                      type="text"
                                      placeholder={field.placeholder}
                                      value={formValues[field._id] || ""}
                                      onChange={(e) => handleFieldChange(field._id, e.target.value)}
                                      required={field.required}
                                    />
                                  )}
                                  {field.type === "email" && (
                                    <Input
                                      id={field._id}
                                      type="email"
                                      placeholder={field.placeholder}
                                      value={formValues[field._id] || ""}
                                      onChange={(e) => handleFieldChange(field._id, e.target.value)}
                                      required={field.required}
                                    />
                                  )}
                                  {field.type === "phone" && (
                                    <Input
                                      id={field._id}
                                      type="tel"
                                      placeholder={field.placeholder}
                                      value={formValues[field._id] || ""}
                                      onChange={(e) => handleFieldChange(field._id, e.target.value)}
                                      required={field.required}
                                    />
                                  )}
                                  {field.type === "number" && (
                                    <Input
                                      id={field._id}
                                      type="number"
                                      placeholder={field.placeholder}
                                      value={formValues[field._id] || ""}
                                      onChange={(e) => handleFieldChange(field._id, e.target.value)}
                                      required={field.required}
                                      min={field.validation?.minValue}
                                      max={field.validation?.maxValue}
                                    />
                                  )}
                                  {field.type === "textarea" && (
                                    <textarea
                                      id={field._id}
                                      className="w-full min-h-[100px] p-2 border rounded-md"
                                      placeholder={field.placeholder}
                                      value={formValues[field._id] || ""}
                                      onChange={(e) => handleFieldChange(field._id, e.target.value)}
                                      required={field.required}
                                    />
                                  )}
                                  {field.type === "dropdown" && (
                                    <Select
                                      value={formValues[field._id] || ""}
                                      onValueChange={(value) => handleFieldChange(field._id, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options?.map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {field.type === "checkbox" && (
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={field._id}
                                        checked={formValues[field._id] || false}
                                        onCheckedChange={(checked) => handleFieldChange(field._id, checked)}
                                        required={field.required}
                                      />
                                      <Label htmlFor={field._id} className="text-sm font-normal">
                                        {field.label}
                                      </Label>
                                    </div>
                                  )}
                                  {errors[field._id] && (
                                    <p className="text-sm text-red-500">{errors[field._id]}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}

                          {Object.keys(errors).length > 0 && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>Please correct the errors above before submitting.</AlertDescription>
                            </Alert>
                          )}

                          <div className="flex justify-end gap-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setActiveTab("overview")}
                              disabled={isSubmitting}
                            >
                              Back to Overview
                            </Button>
                            <Button
                              type="submit"
                              className="bg-yellow-400 hover:bg-yellow-500 text-black"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                </>
                              ) : (
                                "Register"
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{event.location.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{event.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Group:</span>
                  <span className="font-medium">{event.targetGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sessions:</span>
                  <span className="font-medium">{event.sessions.length} sessions</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setActiveTab("registration")}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-6 text-lg font-semibold"
                >
                  Register Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Share This Event</h2>
              <div>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
          */}

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">{event.location.venue}</span>
                </div>
                {event.location.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{event.location.address}</span>
                  </div>
                )}
                {event.location.district && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">District:</span>
                    <span className="font-medium">{event.location.district}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{event.location.onlineEvent ? "Online Event" : "In-person Event"}</span>
                </div>
                {event.location.onlineEvent && event.location.meetingLink && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Meeting Link:</span>
                    <a 
                      href={event.location.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
