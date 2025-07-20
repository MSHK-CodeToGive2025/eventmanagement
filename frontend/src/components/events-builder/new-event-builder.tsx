import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import EventSessions from "./event-sessions"
import { formService } from "@/services/formService"
import { RegistrationForm } from "@/types/form-types"
import eventService from "@/services/eventService"
import { useAuth } from "@/contexts/auth-context"
import {
  ZubinEvent,
  eventCategories,
  targetGroups,
  eventStatuses,
  hongKongDistricts,
} from "@/types/event-types"

// Define the form schema
const eventFormSchema = z.object({
  title: z.string().min(2, {
    message: "Event title is required and must be at least 2 characters.",
  }),
  description: z.string().min(1, {
    message: "Event description is required.",
  }),
  category: z.string().min(1, {
    message: "Category is required.",
  }),
  targetGroup: z.string().min(1, {
    message: "Target group is required.",
  }),
  location: z.object({
    venue: z.string().min(2, {
      message: "Venue is required.",
    }),
    address: z.string().min(2, {
      message: "Address is required.",
    }),
    district: z.string().min(1, {
      message: "District is required.",
    }),
    onlineEvent: z.boolean(),
    meetingLink: z.string().optional(),
  }),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  isPrivate: z.boolean(),
  status: z.enum(["Draft", "Published", "Cancelled", "Completed"]),
  registrationFormId: z.string().min(1, {
    message: "Registration form is required.",
  }),
  sessions: z.array(
    z.object({
      _id: z.string(),
      title: z.string().min(1, "Session title is required"),
      description: z.string().optional(),
      date: z.date(),
      startTime: z.string().min(1, "Start time is required"),
      endTime: z.string().min(1, "End time is required"),
      location: z
        .object({
          venue: z.string().optional(),
          meetingLink: z.string().optional(),
        })
        .optional(),
      capacity: z.number().optional(),
    })
  ),
  capacity: z.number().optional(),
  tags: z.array(z.string()).optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

interface NewEventBuilderProps {
  onClose: () => void
  onSave: (data: ZubinEvent) => void
  eventId?: string | null
  defaultValues?: Partial<ZubinEvent>
}

export default function NewEventBuilder({ onClose, onSave, eventId, defaultValues }: NewEventBuilderProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationForms, setRegistrationForms] = useState<RegistrationForm[]>([])
  const [loadingForms, setLoadingForms] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  // Format today's date for the min attribute of the date input
  const today = new Date()
  const formattedToday = format(today, "yyyy-MM-dd")

  // Fetch registration forms on component mount
  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoadingForms(true)
        const forms = await formService.getAllForms()
        setRegistrationForms(forms)
      } catch (error) {
        console.error("Error fetching registration forms:", error)
        toast({
          title: "Error",
          description: "Failed to load registration forms",
          variant: "destructive",
        })
      } finally {
        setLoadingForms(false)
      }
    }

    fetchForms()
  }, [toast])

  // Initialize the form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      category: "",
      targetGroup: "",
      location: {
        venue: "",
        address: "",
        district: "",
        onlineEvent: false,
      },
      startDate: today,
      endDate: today,
      isPrivate: false,
      status: "Draft",
      registrationFormId: "",
      sessions: [],
      capacity: undefined,
      tags: [],
    },
  })

  // Fetch event data when editing
  useEffect(() => {
    const fetchEventData = async () => {
      if (eventId && !defaultValues) {
        try {
          setIsSubmitting(true)
          const eventData = await eventService.getEvent(eventId)
          
          // Transform the event data to match form structure
          const formData = {
            title: eventData.title,
            description: eventData.description,
            category: eventData.category,
            targetGroup: eventData.targetGroup,
            location: eventData.location,
            startDate: new Date(eventData.startDate),
            endDate: new Date(eventData.endDate),
            isPrivate: eventData.isPrivate,
            status: eventData.status,
            registrationFormId: eventData.registrationFormId,
            sessions: eventData.sessions.map((session: any) => ({
              _id: session._id,
              title: session.title,
              description: session.description,
              date: new Date(session.date),
              startTime: session.startTime,
              endTime: session.endTime,
              location: session.location,
              capacity: session.capacity
            })),
            capacity: eventData.capacity,
            tags: eventData.tags || []
          }

          // Reset form with the fetched data
          form.reset(formData)
          
          // Force a small delay to ensure form fields are properly updated
          setTimeout(() => {
            // Trigger form validation to ensure all fields are properly rendered
            form.trigger()
          }, 100)
          
          // Set preview image if exists
          if (eventData.coverImage?.data) {
            const imageUrl = eventService.getEventImageUrl(eventId, eventData)
            if (imageUrl) {
              setPreviewImage(imageUrl)
            }
          }
        } catch (error) {
          console.error("Error fetching event data:", error)
          toast({
            title: "Error",
            description: "Failed to load event data for editing",
            variant: "destructive",
          })
        } finally {
          setIsSubmitting(false)
        }
      }
    }

    fetchEventData()
  }, [eventId, defaultValues, form, toast])

  // Handle form submission
  async function onSubmit(data: EventFormValues) {
    try {
      setIsSubmitting(true)

      // Validate date logic
      if (data.startDate > data.endDate) {
        toast({
          title: "Invalid Date Range",
          description: "End date must be after start date. Please adjust the event dates.",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create or update events.",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Create FormData for multipart/form-data submission
      const formData = new FormData()
      
      // Add all event data
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      formData.append('targetGroup', data.targetGroup)
      formData.append('location[venue]', data.location.venue)
      formData.append('location[address]', data.location.address)
      formData.append('location[district]', data.location.district)
      formData.append('location[onlineEvent]', data.location.onlineEvent.toString())
      if (data.location.meetingLink) {
        formData.append('location[meetingLink]', data.location.meetingLink)
      }
      formData.append('startDate', data.startDate.toISOString())
      formData.append('endDate', data.endDate.toISOString())
      formData.append('isPrivate', data.isPrivate.toString())
      formData.append('status', data.status)
      formData.append('registrationFormId', data.registrationFormId)
      
      // Add sessions
      data.sessions.forEach((session, index) => {
        formData.append(`sessions[${index}][title]`, session.title)
        if (session.description) {
          formData.append(`sessions[${index}][description]`, session.description)
        }
        formData.append(`sessions[${index}][date]`, session.date.toISOString())
        formData.append(`sessions[${index}][startTime]`, session.startTime)
        formData.append(`sessions[${index}][endTime]`, session.endTime)
        if (session.location?.venue) {
          formData.append(`sessions[${index}][location][venue]`, session.location.venue)
        }
        if (session.location?.meetingLink) {
          formData.append(`sessions[${index}][location][meetingLink]`, session.location.meetingLink)
        }
        if (session.capacity) {
          formData.append(`sessions[${index}][capacity]`, session.capacity.toString())
        }
      })
      
      if (data.capacity) {
        formData.append('capacity', data.capacity.toString())
      }
      
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(tag => {
          formData.append('tags[]', tag)
        })
      }

      // Add image file if selected
      if (selectedImageFile) {
        formData.append('image', selectedImageFile)
      }

      let savedEvent: any

      if (eventId) {
        // Update existing event
        savedEvent = await eventService.updateEvent(eventId, formData)
        toast({
          title: "Event Updated Successfully",
          description: `"${savedEvent.title}" has been updated successfully.`,
          variant: "default"
        })
      } else {
        // Create new event
        savedEvent = await eventService.createEvent(formData)
        toast({
          title: "Event Created Successfully",
          description: `"${savedEvent.title}" has been created successfully.`,
          variant: "default"
        })
      }

      // Call the onSave callback with the saved event
      onSave(savedEvent)
    } catch (error: any) {
      console.error("Error submitting form:", error)
      
      let errorMessage = "There was a problem submitting the form. Please try again."
      
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to create or update events."
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in again to continue."
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Form Submission Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (500KB limit to match backend)
      if (file.size > 500 * 1024) {
        toast({
          title: "File Size Error",
          description: "Image size must be less than 500KB. Please choose a smaller image.",
          variant: "destructive"
        })
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid image file.",
          variant: "destructive"
        })
        return
      }

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewImage(url)
      setSelectedImageFile(file)
    }
  }

  // Clear image
  const clearImage = () => {
    setPreviewImage(null)
    setSelectedImageFile(null)
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 w-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{eventId ? "Edit Event" : "Create New Event"}</h2>
          <p className="text-gray-500">Fill in the details to create a new event. Fields marked with * are required.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="details">Details & Settings</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="basic" className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        Event Title <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        Description <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter event description..."
                          minHeight="200px"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          Category <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          Target Group <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a target group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {targetGroups.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          Start Date <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <CalendarIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <Input
                              type="date"
                              placeholder="Select date"
                              className="pl-10 h-12"
                              min={formattedToday}
                              value={format(field.value, "yyyy-MM-dd")}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          End Date <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <CalendarIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <Input
                              type="date"
                              placeholder="Select date"
                              className="pl-10 h-12"
                              min={formattedToday}
                              value={format(field.value, "yyyy-MM-dd")}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-6">
                <FormField
                  control={form.control}
                  name="location.onlineEvent"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Online Event</FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("location.onlineEvent") ? (
                  <FormField
                    control={form.control}
                    name="location.meetingLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          Meeting Link <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <Link className="h-4 w-4 text-gray-500" />
                            </div>
                            <Input
                              placeholder="Enter meeting link"
                              {...field}
                              className="pl-10 h-12"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="location.venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center">
                            Venue <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MapPin className="h-4 w-4 text-gray-500" />
                              </div>
                              <Input
                                placeholder="Enter venue name"
                                {...field}
                                className="pl-10 h-12"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center">
                            Address <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full address"
                              {...field}
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center">
                            District <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select a district" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {hongKongDistricts.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="sessions" className="space-y-6">
                <FormField
                  control={form.control}
                  name="sessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <EventSessions
                          sessions={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <FormItem>
                  <FormLabel className="text-base font-medium">Event Cover Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="cursor-pointer h-12"
                      />
                      {previewImage && (
                        <div className="relative aspect-video rounded-md overflow-hidden border">
                          <img
                            src={previewImage}
                            alt="Event preview"
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={clearImage}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>Upload an image for the event (optional). Maximum size: 500KB.</FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Private Event</FormLabel>
                      {/* 
                      <FormDescription>
                        Private events are only visible to invited participants.
                      </FormDescription>
                      */}
                      <FormDescription>
                        Private events are NOT visible to public.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Event Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationFormId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        Registration Form <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder={loadingForms ? "Loading forms..." : "Select a registration form"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingForms ? (
                            <SelectItem value="loading" disabled>
                              Loading forms...
                            </SelectItem>
                          ) : registrationForms.length === 0 ? (
                            <SelectItem value="no-forms" disabled>
                              No forms available
                            </SelectItem>
                          ) : (
                            registrationForms.map((form) => (
                              <SelectItem key={form._id} value={form._id}>
                                {form.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {registrationForms.length === 0 && !loadingForms && "No registration forms found. Please create forms first."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Event Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter maximum number of participants"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="h-12"
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for unlimited capacity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-black hover:bg-black/80 text-white h-12 px-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : eventId ? "Update Event" : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </div>
  )
}
