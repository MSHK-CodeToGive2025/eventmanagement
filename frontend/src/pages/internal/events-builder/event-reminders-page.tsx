import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Calendar, Clock, MapPin, Users, Tag, UserCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import RouteGuard from "@/components/route-guard"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

// Mock event data (in a real app, this would come from an API)
const mockEvents = [
  {
    id: "1",
    title: "Career Workshop for Ethnic Minorities",
    description:
      "A workshop designed to help ethnic minorities in Hong Kong develop career skills and find employment opportunities.",
    date: "2025-06-15",
    startTime: "14:00",
    endTime: "17:00",
    location: "Wan Chai Community Center",
    capacity: "50",
    category: "career",
    targetGroup: "ethnic-minorities",
    details: "<p>This workshop will cover resume writing, interview skills, and job search strategies.</p>",
    faqs: "<p><strong>Q: Do I need to bring anything?</strong></p><p>A: Just bring a notebook and pen.</p>",
    imageUrl: "/career-workshop.png",
    status: "Upcoming",
    registrations: 3,
    registrationForm: "form3",
  },
  {
    id: "2",
    title: "Cultural Exchange Festival",
    description: "Celebrate the diverse cultures of Hong Kong's ethnic minorities through food, music, dance, and art.",
    date: "2025-07-22",
    startTime: "11:00",
    endTime: "20:00",
    location: "Victoria Park, Causeway Bay",
    capacity: "500",
    category: "cultural",
    targetGroup: "all",
    details:
      "<p>Join us for a day of cultural celebration featuring performances, food stalls, and interactive activities.</p>",
    faqs: "",
    imageUrl: "/vibrant-cultural-festival.png",
    status: "Published",
    registrations: 78,
    registrationForm: "form4",
  },
]

// Category names mapping
const categoryNames = {
  education: "Education & Training",
  cultural: "Cultural Exchange",
  health: "Health & Wellness",
  career: "Career Development",
  community: "Community Building",
  language: "Language Learning",
  social: "Social Integration",
  youth: "Youth Programs",
  women: "Women's Empowerment",
  other: "Other",
}

// Target groups mapping
const targetGroupNames = {
  all: "All Hong Kong Residents",
  "ethnic-minorities": "Ethnic Minorities",
  "south-asian": "South Asian Community",
  women: "Women",
  youth: "Youth (13-25)",
  children: "Children (0-12)",
  seniors: "Seniors (65+)",
  professionals: "Professionals",
  newcomers: "Newcomers to Hong Kong",
  other: "Other",
}

// Mock registered users data
const generateMockRegisteredUsers = (eventId: string, count: number) => {
  const users = []
  const now = new Date()

  for (let i = 1; i <= count; i++) {
    // Generate a date within the last 30 days
    const registrationDate = new Date(now)
    registrationDate.setDate(now.getDate() - Math.floor(Math.random() * 30))

    users.push({
      id: `user-${eventId}-${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      phone: `+852 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      registrationDate: registrationDate.toISOString(),
      reminderStatus: "Not Sent",
    })
  }

  return users
}

/**
 * Sends a WhatsApp message to a specified phone number
 * @param phoneNumber - The recipient's phone number
 * @param message - The message content to send
 * @returns Promise with the API response
 */
const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
  try {
    const response = await axios.post('/api/events/send-whatsapp-reminder', {
      to: phoneNumber,
      message: message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

export default function EventRemindersPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [event, setEvent] = useState<any>(null)
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [allSent, setAllSent] = useState(false)

  useEffect(() => {
    if (!id) return

    // In a real app, fetch the event and registered users from an API
    const fetchedEvent = mockEvents.find((e) => e.id === id)

    if (fetchedEvent) {
      setEvent(fetchedEvent)
      // Generate mock registered users based on the event's registration count
      setRegisteredUsers(generateMockRegisteredUsers(id, fetchedEvent.registrations))
    }

    setLoading(false)
  }, [id])

  const handleBack = () => {
    navigate(-1) // Go back to previous page
  }
  

  const handleSendReminders = async () => {
    if (sending || allSent) return

    setSending(true)
    setCurrentIndex(0)

    toast({
      variant: "default",
      title: "Sending Reminders",
      description: `Starting to send WhatsApp reminders to ${registeredUsers.length} registered users.`,
    })

    // Process each user one by one with a delay to simulate sending
    for (let i = 0; i < registeredUsers.length; i++) {
      setCurrentIndex(i)
      const user = registeredUsers[i]

      try {
        // Send WhatsApp message to the user
        const message = `Reminder: You are registered for the event "${event.title}" on ${format(parseISO(event.date), "MMMM d, yyyy")} at ${event.startTime}. Location: ${event.location}`;
        await sendWhatsAppMessage(user.phone, message);

        // Update the current user's reminder status
        setRegisteredUsers((prev) =>
          prev.map((user, index) => (index === i ? { ...user, reminderStatus: "Sent" } : user)),
        )

        // Wait for 500ms to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Failed to send message to ${user.phone}:`, error);
        // Update status to indicate failure
        setRegisteredUsers((prev) =>
          prev.map((user, index) => (index === i ? { ...user, reminderStatus: "Failed" } : user)),
        )
      }
    }

    // All reminders processed
    setAllSent(true)
    setSending(false)
    setCurrentIndex(-1)

    toast({
      variant: "default",
      title: "Reminders Sent",
      description: `Successfully sent WhatsApp reminders to all ${registeredUsers.length} registered users.`,
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="animate-pulse bg-gray-200 h-8 w-3/4 rounded"></CardTitle>
            <CardDescription className="animate-pulse bg-gray-200 h-4 w-1/2 rounded"></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="bg-gray-200 h-12 rounded"></div>
              <div className="bg-gray-200 h-64 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>The event you are looking for does not exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/events")}>Return to Events List</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">WhatsApp Reminders</h1>

        {/* Event Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>Send WhatsApp reminders to registered users for this event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">{format(parseISO(event.date), "MMMM d, yyyy")}</span>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="font-medium">Time:</span>
                  <span className="ml-2">
                    {event.startTime} - {event.endTime}
                  </span>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="font-medium">Location:</span>
                  <span className="ml-2">{event.location}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="font-medium">Category:</span>
                  <span className="ml-2">{categoryNames[event.category as keyof typeof categoryNames]}</span>
                </div>

                <div className="flex items-center">
                  <UserCircle className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="font-medium">Target Group:</span>
                  <span className="ml-2">{targetGroupNames[event.targetGroup as keyof typeof targetGroupNames]}</span>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="font-medium">Registered Users:</span>
                  <span className="ml-2">
                    {event.registrations} / {event.capacity}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registered Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>
              {allSent
                ? `WhatsApp reminders have been sent to all ${registeredUsers.length} users.`
                : `Send WhatsApp reminders to ${registeredUsers.length} registered users.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button
                onClick={handleSendReminders}
                disabled={sending || allSent}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending Reminders..." : allSent ? "Reminders Sent" : "Send WhatsApp Reminders"}
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Reminder Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredUsers.map((user, index) => (
                    <TableRow key={user.id} className={currentIndex === index ? "bg-yellow-50" : ""}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{format(parseISO(user.registrationDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.reminderStatus === "Sent" ? "default" : "outline"}
                          className={
                            user.reminderStatus === "Sent"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }
                        >
                          {user.reminderStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  )
}
