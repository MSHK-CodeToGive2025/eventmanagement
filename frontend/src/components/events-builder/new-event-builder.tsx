import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

// Define the form schema
const eventFormSchema = z.object({
  title: z.string().min(2, {
    message: "Event title is required and must be at least 2 characters.",
  }),
  date: z.string().min(1, {
    message: "Event date is required.",
  }),
  startTime: z.string().min(1, {
    message: "Start time is required.",
  }),
  endTime: z.string().min(1, {
    message: "End time is required.",
  }),
  location: z.string().min(2, {
    message: "Location is required and must be at least 2 characters.",
  }),
  capacity: z.string().min(1, {
    message: "Capacity is required.",
  }),
  category: z.string().min(1, {
    message: "Category is required.",
  }),
  targetGroup: z.string().min(1, {
    message: "Target group is required.",
  }),
  registrationForm: z.string().optional(),
  details: z.string().optional(),
  faqs: z.string().optional(),
  imageUrl: z.string().optional(),
  organizer: z.string(),
  status: z.string(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

// Event categories
const eventCategories = [
  { id: "education", name: "Education & Training" },
  { id: "cultural", name: "Cultural Exchange" },
  { id: "health", name: "Health & Wellness" },
  { id: "career", name: "Career Development" },
  { id: "community", name: "Community Building" },
  { id: "language", name: "Language Learning" },
  { id: "social", name: "Social Integration" },
  { id: "youth", name: "Youth Programs" },
  { id: "women", name: "Women's Empowerment" },
  { id: "other", name: "Other" },
]

// Target groups
const targetGroups = [
  { id: "all", name: "All Hong Kong Residents" },
  { id: "ethnic-minorities", name: "Ethnic Minorities" },
  { id: "south-asian", name: "South Asian Community" },
  { id: "women", name: "Women" },
  { id: "youth", name: "Youth (13-25)" },
  { id: "children", name: "Children (0-12)" },
  { id: "seniors", name: "Seniors (65+)" },
  { id: "professionals", name: "Professionals" },
  { id: "newcomers", name: "Newcomers to Hong Kong" },
  { id: "other", name: "Other" },
]

// Mock forms data for the dropdown
const availableForms = [
  { id: "form1", title: "Basic Registration Form" },
  { id: "form2", title: "Detailed Participant Information" },
  { id: "form3", title: "Workshop Registration" },
  { id: "form4", title: "Cultural Event Registration" },
  { id: "form5", title: "Health Seminar Registration" },
  { id: "form6", title: "Youth Program Application" },
]

interface NewEventBuilderProps {
  onClose: () => void
  onSave: (data: EventFormValues) => void
  eventId?: string | null
  defaultValues?: Partial<EventFormValues>
}

export default function NewEventBuilder({ onClose, onSave, eventId, defaultValues }: NewEventBuilderProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFormTitle, setSelectedFormTitle] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Format today's date for the min attribute of the date input
  const today = new Date()
  const formattedToday = format(today, "yyyy-MM-dd")

  // Initialize the form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: defaultValues || {
      title: "",
      date: formattedToday,
      startTime: "",
      endTime: "",
      location: "",
      capacity: "",
      category: "",
      targetGroup: "",
      registrationForm: "",
      details: "",
      faqs: "",
      imageUrl: "",
      organizer: "The Zubin Foundation",
      status: "Draft",
    },
  })

  // Update the selected form title when the form changes
  useEffect(() => {
    const formId = form.watch("registrationForm")
    if (formId) {
      const selectedForm = availableForms.find((form) => form.id === formId)
      if (selectedForm) {
        setSelectedFormTitle(selectedForm.title)
      }
    } else {
      setSelectedFormTitle("")
    }
  }, [form.watch("registrationForm")])

  // Handle form submission
  async function onSubmit(data: EventFormValues) {
    try {
      setIsSubmitting(true)

      // Validate time logic
      const startTime = data.startTime
      const endTime = data.endTime

      if (startTime >= endTime) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time. Please adjust the event times.",
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      // Create a new event object with the form data
      const newEvent = {
        id: eventId || String(Date.now()), // Use existing ID or generate a new one
        ...data,
        registrations: 0, // New events start with 0 registrations
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSave(newEvent)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Form Submission Error",
        description: "There was a problem submitting the form. Please try again.",
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
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Size Warning",
          description: "The uploaded image is larger than 5MB. This may cause slower loading times for users.",
          variant: "default"
        })
      }

      const url = URL.createObjectURL(file)
      setPreviewImage(url)
      form.setValue("imageUrl", url)
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
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="details">Details & FAQs</TabsTrigger>
            <TabsTrigger value="image">Event Image</TabsTrigger>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center">
                          Date <span className="text-red-500 ml-1">*</span>
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
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center">
                            Start Time <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Clock className="h-4 w-4 text-gray-500" />
                              </div>
                              <Input type="time" placeholder="Select time" className="pl-10 h-12" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center">
                            End Time <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Clock className="h-4 w-4 text-gray-500" />
                              </div>
                              <Input type="time" placeholder="Select time" className="pl-10 h-12" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        Location <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event location" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium flex items-center">
                        Capacity <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter maximum number of participants"
                          {...field}
                          className="h-12"
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
                          Event Category <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a target group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {targetGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="registrationForm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Registration Form</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select a registration form" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableForms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedFormTitle
                          ? `Selected form: ${selectedFormTitle}`
                          : "Select a form to use for event registration"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Organizer</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Event Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Event Details</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Enter detailed information about the event..."
                          minHeight="300px"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide detailed information about the event. You can use formatting options like bold, italic,
                        and lists.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="faqs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Frequently Asked Questions</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Enter FAQs about the event..."
                          minHeight="300px"
                        />
                      </FormControl>
                      <FormDescription>Add frequently asked questions and answers about the event.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="image" className="space-y-6">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Event Image</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              handleImageUpload(e)
                              field.onChange(field.value)
                            }}
                            className="cursor-pointer h-12"
                          />
                          {(previewImage || field.value) && (
                            <div className="relative aspect-video rounded-md overflow-hidden border">
                              <img
                                src={previewImage || field.value || "/placeholder.svg"}
                                alt="Event preview"
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>Upload an image for the event (optional).</FormDescription>
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
