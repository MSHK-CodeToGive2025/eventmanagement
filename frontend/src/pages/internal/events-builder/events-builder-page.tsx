import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import EnhancedEventsList from "@/components/events-builder/enhanced-events-list"
import NewEventBuilder from "@/components/events-builder/new-event-builder"
import RouteGuard from "@/components/route-guard"
import { useToast } from "@/hooks/use-toast"

export default function EventsBuilderPage() {
  const [showEventBuilder, setShowEventBuilder] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCreateEvent = () => {
    setShowEventBuilder(true)
    setEditingEventId(null)
  }

  const handleEditEvent = (eventId: string) => {
    setShowEventBuilder(true)
    setEditingEventId(eventId)

    // Show info toast when editing an event
    toast({
      title: "Editing Event",
      description: "You are now editing an existing event. Make your changes and click 'Update Event' to save.",
      variant: "default"
    })
  }

  const handleCloseEventBuilder = () => {
    setShowEventBuilder(false)
    setEditingEventId(null)
  }

  const handleSaveEvent = (data: any) => {
    try {
      console.log("Saving event:", data)

      // Simulate a random error for demonstration purposes (1 in 10 chance)
      if (Math.random() < 0.1) {
        throw new Error("Simulated server error")
      }

      // Check if the event has a registration form
      if (!data.registrationForm) {
        // Show a warning toast if no registration form is selected
        toast({
          title: "Event Saved with Warning",
          description: `"${data.title}" has been ${editingEventId ? "updated" : "created"}, but no registration form was selected. Attendees won't be able to register for this event.`,
          variant: "default"
        })
      } else {
        // Show a success toast
        toast({
          title: editingEventId ? "Event Updated Successfully" : "Event Created Successfully",
          description: `"${data.title}" has been ${editingEventId ? "updated" : "created"} and is now ${data.status === "Published" ? "visible to users" : "saved as " + data.status}.`,
          variant: "default"
        })
      }

      setShowEventBuilder(false)
      setEditingEventId(null)
    } catch (error) {
      // Handle errors and show appropriate toast
      console.error("Error saving event:", error)
      toast({
        title: (error as Error).message,
        description: "There was a problem saving your event. Please try again or contact support if the issue persists.",
        variant: "destructive"
      })
    }
  }

  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Events Builder</h1>
        <p className="text-gray-600 mb-8">Create and manage events for the Zubin Foundation.</p>

        {showEventBuilder ? (
          <NewEventBuilder onClose={handleCloseEventBuilder} onSave={handleSaveEvent} eventId={editingEventId} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Events</h2>
              <Button onClick={handleCreateEvent} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Event
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Manage Events</CardTitle>
                <CardDescription>
                  View, edit, and delete events. Use the search and filters to find specific events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedEventsList onEditEvent={handleEditEvent} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  )
}
