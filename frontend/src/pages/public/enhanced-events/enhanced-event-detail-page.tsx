import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, Share2, Calendar, MapPin, AlertCircle, Loader2, CheckCircle, XCircle, ArrowLeft, UserPlus, Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ZubinEvent } from "@/types/event-types"
import { RegistrationForm } from "@/types/form-types"
import eventService from "@/services/eventService"
import { formService } from "@/services/formService"
import registrationService, { EventRegistration } from "@/services/registrationService"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { RichTextDisplay } from "@/components/ui/rich-text-display"

export default function EnhancedEventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  // Event and form state
  const [event, setEvent] = useState<ZubinEvent | null>(null)
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Registration state
  const [userRegistrations, setUserRegistrations] = useState<EventRegistration[]>([])
  const [activeRegistration, setActiveRegistration] = useState<EventRegistration | null>(null)
  const [checkingRegistration, setCheckingRegistration] = useState(false)

  // Streamlined form state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3 // Sessions, Form, Confirmation
  const [registrationFormRef, setRegistrationFormRef] = useState<HTMLDivElement | null>(null)
  const [showRegistrationStarted, setShowRegistrationStarted] = useState(false)

  // Check if user can register (no active registration exists)
  const canRegister = !activeRegistration && isAuthenticated && user
  const isRegistered = activeRegistration?.status === 'registered'
  const hasCancelledRegistration = userRegistrations.some(reg => reg.status === 'cancelled' || reg.status === 'rejected')
  const isEventFull = event?.registeredCount && event?.capacity && event.registeredCount >= event.capacity

  // Function to handle starting registration
  const handleStartRegistration = () => {
    setShowRegistrationForm(true)
    setCurrentStep(1)
    setSelectedSessions([])
    setFormValues({})
    setErrors({})
    setShowRegistrationStarted(true)
    
    // Hide the notification after 4 seconds
    setTimeout(() => setShowRegistrationStarted(false), 4000)
  }

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (typeof id !== "string") {
          throw new Error("Invalid event ID")
        }

        // Get event data from location state or fetch it
        const eventData = location.state?.event || await eventService.getEvent(id)
        if (!eventData) {
          setError("Event not found")
          return
        }

        setEvent(eventData)

        // Fetch registration form
        try {
          const formData = await formService.getForm(eventData.registrationFormId)
          setRegistrationForm(formData)
        } catch (error) {
          // Error fetching registration form
        }

        // Check user registrations for this event
        if (isAuthenticated && user) {
          await checkUserRegistrations(eventData._id)
        }
      } catch (error: any) {
        setError(error.message || "Failed to load event details")
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [id, navigate, location.state, isAuthenticated, user])

  // Recheck registration status when window gains focus or location changes
  useEffect(() => {
    const handleFocus = () => {
      if (event && isAuthenticated && user) {
        checkUserRegistrations(event._id)
      }
    }

    window.addEventListener('focus', handleFocus)
    
    // Also check when the component mounts or location changes
    if (event && isAuthenticated && user) {
      checkUserRegistrations(event._id)
    }

    return () => window.removeEventListener('focus', handleFocus)
  }, [event?._id, isAuthenticated, user, location.key])

  // Handle scrolling to registration form when it appears
  useEffect(() => {
    if (showRegistrationForm && registrationFormRef && showRegistrationStarted) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Double-check that the element still exists and is in the DOM
          if (registrationFormRef && document.contains(registrationFormRef)) {
            registrationFormRef.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            })
          }
        }, 150) // Slightly increased delay for better reliability
      })
    }
  }, [showRegistrationForm, registrationFormRef, showRegistrationStarted])

  const checkUserRegistrations = async (eventId: string) => {
    if (!isAuthenticated || !user) return

    setCheckingRegistration(true)
    try {
      const registrations = await registrationService.getUserEventRegistrations(eventId)
      setUserRegistrations(registrations)
      
      // Find active registration (status: registered)
      const active = registrations.find(reg => reg.status === 'registered')
      setActiveRegistration(active || null)
    } catch (error) {
      // Error checking user registrations
    } finally {
      setCheckingRegistration(false)
    }
  }

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

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (currentStep === 1) {
      // Validate session selection
      if (selectedSessions.length === 0) {
        newErrors.sessions = "Please select at least one session"
        isValid = false
      }
    } else if (currentStep === 2 && registrationForm) {
      // Validate form fields
      registrationForm.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.required && !formValues[field._id]) {
            newErrors[field._id] = `${field.label} is required`
            isValid = false
          }
        })
      })
    }

    setErrors(newErrors)
    return isValid
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!event || !registrationForm || !user) return

    if (!validateCurrentStep()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare registration data
      const registrationData = {
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
      };



      // Call backend to save registration
      await eventService.registerForEventV2(event._id, registrationData)

      setRegistrationComplete(true)
      setCurrentStep(3)
      
      // Refresh registration status immediately
      await checkUserRegistrations(event._id)
      
      // Also update the active registration state
      const updatedRegistrations = await registrationService.getUserEventRegistrations(event._id)
      const newActiveRegistration = updatedRegistrations.find(reg => reg.status === 'registered')
      setActiveRegistration(newActiveRegistration || null)
      setUserRegistrations(updatedRegistrations)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "There was an unexpected error. Please try again later."
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedSessions([])
    setFormValues({})
    setErrors({})
    setRegistrationComplete(false)
    setCurrentStep(1)
    setShowRegistrationForm(false)
  }

  const getRegistrationStatusBadge = () => {
    if (!activeRegistration) return null

    const statusConfig = {
      registered: { label: "Registered", variant: "default", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", variant: "destructive", className: "bg-red-100 text-red-800" },
      rejected: { label: "Rejected", variant: "destructive", className: "bg-red-100 text-red-800" }
    }

    const config = statusConfig[activeRegistration.status as keyof typeof statusConfig]
    if (!config) return null

    return (
      <Badge variant={config.variant as any} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const renderRegistrationStatus = () => {
    if (!isAuthenticated) {
      return (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <UserPlus className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-3 text-yellow-800">Join This Event</h3>
            <p className="text-gray-700 mb-6">Sign in to register and secure your spot!</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/sign-in")} variant="outline">
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/sign-up")}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (checkingRegistration) {
      return (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-3">Checking Registration Status</h3>
            <p className="text-gray-700">Please wait while we check your registration status...</p>
          </CardContent>
        </Card>
      )
    }

    if (isRegistered) {
      return (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-3 text-green-700">✓ Successfully Registered!</h3>
            <p className="text-gray-700 mb-6">
              You're all set for this event. We look forward to seeing you!
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/profile/registrations")} variant="outline">
                View My Registrations
              </Button>
              <Button onClick={() => navigate("/enhanced-events")} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                Browse Other Events
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (isEventFull) {
      return (
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-3 text-red-700">Event Full</h3>
            <p className="text-gray-700 mb-6">
              This event has reached its capacity. Please check back later or explore other events.
            </p>
            <Button onClick={() => navigate("/enhanced-events")} variant="outline">
              Browse Other Events
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (registrationComplete) {
      return (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-3 text-green-700">Registration Complete!</h3>
            <p className="text-gray-700 mb-6">
              Thank you for registering for this event. 
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/enhanced-events")} variant="outline">
                Browse Other Events
              </Button>
              <Button onClick={() => navigate("/profile/registrations")} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                View My Registrations
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Star className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Ready to Join?</h3>
          <p className="text-gray-700 mb-6">
            {hasCancelledRegistration 
              ? "You can register again for this event."
              : "Secure your spot by registering now!"
            }
          </p>
          <Button
            onClick={handleStartRegistration}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3"
            size="lg"
          >
            Register Now
          </Button>
        </CardContent>
      </Card>
    )
  }

  const renderRegistrationForm = () => {
    if (!showRegistrationForm) return null

    return (
      <Card className="mt-6 border-2 border-yellow-300 shadow-lg animate-in slide-in-from-bottom-2" ref={setRegistrationFormRef}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Event Registration</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRegistrationForm(false)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{currentStep === 1 ? "Select Sessions" : currentStep === 2 ? "Fill Form" : "Confirm"}</span>
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Sessions</h3>
                <p className="text-gray-600 mb-6">Choose the session(s) you'd like to attend:</p>
              </div>
              
              {errors.sessions && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.sessions}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {event?.sessions.map((session) => (
                  <Card key={session._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{session.title}</h4>
                          {session.description && (
                            <p className="text-gray-600 mb-2 text-sm">{session.description}</p>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(session.date).toLocaleDateString()}</span>
                            <Clock className="h-4 w-4 mr-2 ml-4" />
                            <span>{session.startTime} - {session.endTime}</span>
                          </div>
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

              <div className="flex justify-end pt-4">
                <Button
                  onClick={nextStep}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  disabled={selectedSessions.length === 0}
                >
                  Next: Fill Form
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Registration Information</h3>
                <p className="text-gray-600">Please provide the required information:</p>
              </div>

              {hasCancelledRegistration && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You previously cancelled your registration for this event. You can register again if you'd like to attend.
                  </AlertDescription>
                </Alert>
              )}

              {errors.submit && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              {registrationForm?.sections.map((section) => (
                <Card key={section._id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    {section.description && (
                      <p className="text-gray-600">{section.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field._id} className="space-y-2">
                        <Label htmlFor={field._id}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                                        {field.helpText && (
                  <RichTextDisplay 
                    content={field.helpText} 
                    className="text-sm text-gray-500"
                  />
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
                            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                        {field.type === "radio" && (
                          <RadioGroup
                            value={formValues[field._id] || ""}
                            onValueChange={(value) => handleFieldChange(field._id, value)}
                          >
                            {field.options?.map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${field._id}-${option}`} />
                                <Label htmlFor={`${field._id}-${option}`} className="text-sm font-normal">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                        {field.type === "checkbox" && (
                          <div className="space-y-2">
                            {field.options?.map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${field._id}-${option}`}
                                  checked={Array.isArray(formValues[field._id]) ? formValues[field._id].includes(option) : false}
                                  onCheckedChange={(checked) => {
                                    const currentValues = Array.isArray(formValues[field._id]) ? formValues[field._id] : []
                                    if (checked) {
                                      handleFieldChange(field._id, [...currentValues, option])
                                    } else {
                                      handleFieldChange(field._id, currentValues.filter((v: string) => v !== option))
                                    }
                                  }}
                                  required={field.required}
                                />
                                <Label htmlFor={`${field._id}-${option}`} className="text-sm font-normal">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                        {errors[field._id] && (
                          <p className="text-sm text-red-500">{errors[field._id]}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  Back to Sessions
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-green-700">Registration Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Your registration has been successfully submitted. You will receive a confirmation email shortly.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => navigate("/enhanced-events")} variant="outline">
                  Browse Other Events
                </Button>
                <Button onClick={() => navigate("/profile/registrations")} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                  View My Registrations
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-200 aspect-square rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-200 aspect-square rounded-lg"></div>
              <div className="bg-gray-200 aspect-square rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The event you're looking for doesn't exist or has been removed."}</p>
          <Button onClick={() => navigate("/enhanced-events")}>Browse All Events</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/enhanced-events")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {/* Event Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
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
            </div>
          </div>
          {getRegistrationStatusBadge()}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-yellow-50">
            {event.category}
          </Badge>
          <Badge variant="outline" className="bg-blue-50">
            {event.targetGroup}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Registration Started Notification */}
          {showRegistrationStarted && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200 animate-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Registration started! Scroll down to complete your registration form.
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-8">
            <CardContent className="p-0">
              {event.coverImage && (
                <div className="relative w-full aspect-square">
                  <img
                    src={eventService.getEventImageUrl(event._id, event)}
                    alt={event.title}
                    className="object-cover w-full h-full rounded-t-lg"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                    <RichTextDisplay 
                      content={event.description} 
                      className="text-gray-700"
                      placeholder="No description available for this event."
                    />
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-xl font-semibold mb-4">Event Sessions</h2>
                    <div className="space-y-4">
                      {event.sessions.map((session) => (
                        <Card key={session._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start">
                              <div className="flex-1">
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
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          {renderRegistrationForm()}
        </div>

        <div className="space-y-6">
          {/* Registration Status - Now Prominent */}
          {renderRegistrationStatus()}

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{event.location.venue}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{event.category}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">Target Group:</span>
                <span className="font-medium">{event.targetGroup}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions:</span>
                <span className="font-medium">{event.sessions.length} sessions</span>
              </div>
              {event.capacity && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">
                      {event.registeredCount || 0}/{event.capacity} registered
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Venue:</span>
                <span className="font-medium">{event.location.venue}</span>
              </div>
              <Separator />
              {event.location.address && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{event.location.address}</span>
                  </div>
                  <Separator />
                </>
              )}
              {event.location.district && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">District:</span>
                    <span className="font-medium">{event.location.district}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{event.location.onlineEvent ? "Online Event" : "In-person Event"}</span>
              </div>
              {event.location.onlineEvent && event.location.meetingLink && (
                <>
                  <Separator />
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
