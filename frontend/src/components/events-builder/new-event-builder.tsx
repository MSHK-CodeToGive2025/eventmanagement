import { useState } from "react"
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
import { CalendarIcon, Clock, MapPin, Link, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import EventSessions from "./event-sessions"
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
  coverImageUrl: z.string().optional(),
  isPrivate: z.boolean(),
  status: z.enum(["draft", "published", "cancelled", "completed"]),
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
      coverImageUrl: "",
      isPrivate: false,
      status: "draft",
      registrationFormId: "",
      sessions: [],
      capacity: undefined,
      tags: [],
    },
  })

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

      // Create a new event object with the form data
      const newEvent: ZubinEvent = {
        _id: eventId || `temp-${Date.now()}`,
        ...data,
        createdBy: "current-user-id", // This should come from your auth context
        createdAt: new Date(),
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
      form.setValue("coverImageUrl", url)
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Event Cover Image</FormLabel>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select a registration form" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* This should be populated from your forms data */}
                          <SelectItem value="form1">Basic Registration Form</SelectItem>
                          <SelectItem value="form2">Detailed Participant Information</SelectItem>
                        </SelectContent>
                      </Select>
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
