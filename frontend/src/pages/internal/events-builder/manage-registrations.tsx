import { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Tag, Users, FileText, MessageSquare, X, Search, Eye, ArrowLeft } from "lucide-react"
import { ZubinEvent, eventCategories, targetGroups } from "@/types/event-types"
import RegistrationFormDialog from "@/components/events-builder/registration-form-dialog"
import { RegistrationForm } from "@/types/form-types"
import { mockEventRegistrations, mockRegistrationForms } from "@/types/mock-enhanced-event-data"

export default function ManageRegistrations() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const event = location.state?.event as ZubinEvent;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "attended" | "cancelled" | "waitlisted">("all");
  const [selectedRegistration, setSelectedRegistration] = useState<typeof mockEventRegistrations[0] | null>(null);

  // Get registrations for this event
  const eventRegistrations = mockEventRegistrations.filter(reg => reg.eventId === event._id);
  const registrationForm = mockRegistrationForms.find(form => form._id === event.registrationFormId);

  // Filter registrations based on search query and status
  const filteredRegistrations = eventRegistrations.filter((registration) => {
    const searchString = `${registration.attendee.firstName} ${registration.attendee.lastName} ${registration.attendee.phone} ${registration.attendee.email || ""}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewForm = (registration: typeof mockEventRegistrations[0]) => {
    setSelectedRegistration(registration);
  };

  const handleRejectRegistration = (registrationId: string) => {
    // TODO: Implement API call to reject registration
    console.log("Rejecting registration:", registrationId);
    // Update local state
    const updatedRegistrations = eventRegistrations.map(reg =>
      reg._id === registrationId
        ? { ...reg, status: "cancelled" as const }
        : reg
    );
    // In a real app, you would update the state with the API response
    console.log("Updated registrations:", updatedRegistrations);
    setSelectedRegistration(null);
  };

  type RegistrationStatus = "pending" | "confirmed" | "attended" | "cancelled" | "waitlisted";

  const getStatusVariant = (status: RegistrationStatus) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      case "attended":
        return "default";
      case "waitlisted":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusClassName = (status: RegistrationStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "attended":
        return "bg-blue-100 text-blue-800";
      case "waitlisted":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Event not found</p>
        <Button onClick={() => navigate("/manage/events-builder")}>Back to Events</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/manage/events-builder")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events Builder
      </Button>

      {/* Event Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{event.title}</h2>
                <div className="flex items-center mt-2 text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    {format(event.startDate, "MMM d, yyyy")}
                    {event.startDate !== event.endDate && ` - ${format(event.endDate, "MMM d, yyyy")}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-gray-500">
                <MapPin className="h-4 w-4 mr-2" />
                <span>
                  {event.location.venue}
                  {event.location.address && `, ${event.location.address}`}
                  {event.location.district && `, ${event.location.district}`}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-gray-500" />
                <Badge variant="outline" className="bg-gray-50">
                  {event.category}
                </Badge>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <Badge variant="outline" className="bg-gray-50">
                  {event.targetGroup}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registrations</CardTitle>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search registrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[300px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {registration.attendee.firstName} {registration.attendee.lastName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{registration.attendee.phone}</p>
                        {registration.attendee.email && (
                          <p className="text-sm text-gray-500">{registration.attendee.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(registration.status as RegistrationStatus)}
                        className={getStatusClassName(registration.status as RegistrationStatus)}
                      >
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(registration.registeredAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewForm(registration)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Form
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement WhatsApp message functionality
                            console.log("Send WhatsApp message to:", registration.attendee.phone);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                        {(registration.status === "pending" || true) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectRegistration(registration._id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Registration Form Dialog */}
      {selectedRegistration && registrationForm && (
        <RegistrationFormDialog
          isOpen={!!selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          registration={selectedRegistration}
          form={registrationForm}
          onReject={handleRejectRegistration}
        />
      )}
    </div>
  );
} 