import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DynamicFormField } from "@/components/events/dynamic-form-field"
import { Clock, Users, Share2, Calendar, MapPin, User, Tag, Info, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ZubinEvent, EventRegistration, FormField, generateId, saveEventRegistration } from "@/types/enhanced-event-types"
import { getEnhancedEventById } from "@/types/mock-enhanced-event-data"

export default function EnhancedEventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<ZubinEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")
  const { isAuthenticated } = useAuth()

  // Form state
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (typeof id !== "string") {
          throw new Error("Invalid event ID")
        }

        const eventData = await getEnhancedEventById(id)
        if (!eventData) {
          navigate("/events/not-found")
          return
        }

        setEvent(eventData)
      } catch (error) {
        console.error("Error fetching event:", error)
        console.log("Failed to load event details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id, navigate])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when field is edited
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    if (!event?.associatedRegistrationForm) return false

    const newErrors: Record<string, string> = {}
    let isValid = true

    event.associatedRegistrationForm.formFields.forEach((field: FormField) => {
      // Skip validation for non-required empty fields
      if (!field.isRequired && (formValues[field.fieldId] === undefined || formValues[field.fieldId] === "")) {
        return
      }

      // Required field validation
      if (field.isRequired && (formValues[field.fieldId] === undefined || formValues[field.fieldId] === "")) {
        newErrors[field.fieldId] = `${field.fieldLabel} is required`
        isValid = false
        return
      }

      // Pattern validation for text, email, tel
      if (
        field.validation?.pattern &&
        ["text", "email", "tel"].includes(field.fieldType) &&
        formValues[field.fieldId]
      ) {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(formValues[field.fieldId])) {
          newErrors[field.fieldId] = field.validation.message || "Invalid format"
          isValid = false
        }
      }

      // Length validation
      if (
        field.validation?.minLength &&
        ["text", "textarea"].includes(field.fieldType) &&
        formValues[field.fieldId]?.length < field.validation.minLength
      ) {
        newErrors[field.fieldId] = `${field.fieldLabel} must be at least ${field.validation.minLength} characters long`
        isValid = false
      }

      if (
        field.validation?.maxLength &&
        ["text", "textarea"].includes(field.fieldType) &&
        formValues[field.fieldId]?.length > field.validation.maxLength
      ) {
        newErrors[field.fieldId] = `${field.fieldLabel} cannot exceed ${field.validation.maxLength} characters`
        isValid = false
      }

      // Checkbox validation
      if (field.fieldType === "checkbox" && field.isRequired && !formValues[field.fieldId]) {
        newErrors[field.fieldId] = `You must agree to ${field.fieldLabel.toLowerCase()}`
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!event) return

    if (!validateForm()) {
      console.log("Please correct the errors in the form before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      // Create registration data
      const registration: EventRegistration = {
        registrationId: generateId(),
        eventId: event.eventId,
        submittedAt: new Date().toISOString(),
        status: "pending",
        formData: { ...formValues },
      }

      // Save registration
      const result = saveEventRegistration(registration)

      if (result.success) {
        console.log("Your registration has been submitted successfully.")
        setRegistrationComplete(true)
        // Update event with new registration count
        setEvent((prev: ZubinEvent | null) => {
          if (!prev) return null
          return {
            ...prev,
            registeredCount: prev.registeredCount + 1,
          }
        })
      } else {
        console.log(result.message || "There was an error processing your registration.")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      console.log("There was an unexpected error. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
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

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{event.eventTitle}</h1>
        {activeTab !== "registration" && !registrationComplete && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Don't miss out!{" "}
                  {event.registeredCount < event.capacity
                    ? `Only ${event.capacity - event.registeredCount} spots remaining.`
                    : "This event is filling up quickly."}
                  <button
                    onClick={() => setActiveTab("registration")}
                    className="font-medium underline ml-1 focus:outline-none"
                  >
                    Register now
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            <span>
              {event.startTime} - {event.endTime}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <span>
              {event.registeredCount}/{event.capacity} registered
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
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
              <div className="relative w-full h-64 sm:h-80">
                <img
                  src={event.imageUrl || "/placeholder.svg?height=400&width=800&query=event"}
                  alt={event.eventTitle}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              </div>
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="details" className="flex-1">
                      Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="registration"
                      className="flex-1 bg-yellow-50 data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                    >
                      Registration
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                      <p className="text-gray-700 whitespace-pre-line">{event.eventDetails}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-yellow-500" />
                          Date & Time
                        </h3>
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">Date:</span> {formattedDate}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Time:</span> {event.startTime} - {event.endTime}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-yellow-500" />
                          Location
                        </h3>
                        <p className="text-gray-700">{event.location}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Tag className="h-5 w-5 mr-2 text-yellow-500" />
                          Category & Type
                        </h3>
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">Category:</span> {event.category}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <User className="h-5 w-5 mr-2 text-yellow-500" />
                          Audience
                        </h3>
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">Target Group:</span> {event.targetGroup}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Capacity:</span> {event.capacity} attendees
                        </p>
                      </div>
                    </div>

                    {event.associatedRegistrationForm && (
                      <div className="bg-gray-50 p-4 rounded-lg mt-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Info className="h-5 w-5 mr-2 text-yellow-500" />
                          Registration Information
                        </h3>
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">Form:</span> {event.associatedRegistrationForm.formTitle}
                        </p>
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">Category:</span> {event.associatedRegistrationForm.formCategory}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Required Fields:</span>{" "}
                          {event.associatedRegistrationForm.formFields.filter((field: FormField) => field.isRequired).length} of{" "}
                          {event.associatedRegistrationForm.formFields.length}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="registration">
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold mb-2">Registration Information</h2>
                      <p className="text-gray-700 mb-6">
                        This event requires pre-registration. Please complete the registration form to secure your spot.
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
                      ) : event.registeredCount >= event.capacity ? (
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
                            Thank you for registering for this event. You will receive a confirmation email shortly.
                          </p>
                          <div className="flex justify-center gap-4">
                            <Button onClick={() => navigate("/enhanced-events")} variant="outline">
                              Browse Other Events
                            </Button>
                            <Button onClick={resetForm} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                              Register Another Person
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {event.associatedRegistrationForm.formFields.map((field: FormField) =>
                            field.fieldType === "checkbox" ? null : (
                              <DynamicFormField
                                key={field.fieldId}
                                field={field}
                                value={formValues[field.fieldId]}
                                onChange={handleFieldChange}
                                error={errors[field.fieldId]}
                              />
                            ),
                          )}

                          {/* Render checkbox fields at the end */}
                          {event.associatedRegistrationForm.formFields
                            .filter((field: FormField) => field.fieldType === "checkbox")
                            .map((field: FormField) => (
                              <DynamicFormField
                                key={field.fieldId}
                                field={field}
                                value={formValues[field.fieldId]}
                                onChange={handleFieldChange}
                                error={errors[field.fieldId]}
                              />
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
                              onClick={() => setActiveTab("details")}
                              disabled={isSubmitting}
                            >
                              Back to Details
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
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {event.startTime} - {event.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{event.location}</span>
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
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{event.capacity} attendees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registered:</span>
                  <span className="font-medium">{event.registeredCount} attendees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Form ID:</span>
                  <span className="font-medium">{event.associatedRegistrationForm.formId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
    </div>
  )
}
