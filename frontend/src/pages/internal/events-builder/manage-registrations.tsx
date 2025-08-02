import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Tag, Users, FileText, MessageSquare, X, Search, Eye, ArrowLeft, Loader2, Printer } from "lucide-react"
import { ZubinEvent, eventCategories, targetGroups } from "@/types/event-types"
import RegistrationFormDialog from "@/components/events-builder/registration-form-dialog"
import WhatsAppMessageDialog from "@/components/events-builder/whatsapp-message-dialog"
import { RegistrationForm } from "@/types/form-types"
import registrationService, { EventRegistration } from "@/services/registrationService"
import { formService } from "@/services/formService"
import eventService from "@/services/eventService"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function ManageRegistrations() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const event = location.state?.event as ZubinEvent;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "registered" | "cancelled" | "rejected">("registered");
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const [registrationToReject, setRegistrationToReject] = useState<EventRegistration | null>(null);
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  
  // State for real data
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch registrations and form data
  useEffect(() => {
    const fetchData = async () => {
      if (!event?._id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch registrations for this event
        const registrationsData = await registrationService.getEventRegistrations(event._id);
        setRegistrations(registrationsData);
        
        // Fetch registration form
        if (event.registrationFormId) {
          const formData = await formService.getForm(event.registrationFormId);
          setRegistrationForm(formData);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load registrations');
        toast({
          title: "Error",
          description: err.message || "Failed to load registrations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [event?._id, event?.registrationFormId, toast]);

  // Filter registrations based on search query and status
  const filteredRegistrations = registrations.filter((registration) => {
    const searchString = `${registration.attendee.firstName} ${registration.attendee.lastName} ${registration.attendee.phone} ${registration.attendee.email || ""}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewForm = (registration: EventRegistration) => {
    setSelectedRegistration(registration);
  };

  // Check if user can send WhatsApp messages (admin, staff, or event creator)
  const canSendWhatsApp = user && (
    user.role === 'admin' || 
    user.role === 'staff' || 
    (event?.createdBy && event.createdBy._id === user._id)
  );

  // Get registered participants count
  const registeredParticipantsCount = registrations.filter(reg => reg.status === 'registered').length;

  const handleSendWhatsAppMessage = async (title: string, message: string) => {
    if (!event?._id) {
      throw new Error("Event ID not found");
    }
    return await eventService.sendWhatsAppMessage(event._id, title, message);
  };

  const handleRejectRegistration = async (registrationId: string) => {
    try {
      await registrationService.updateRegistrationStatus(registrationId, 'rejected');
      
      // Update local state
      setRegistrations(prev => prev.map(reg =>
        reg._id === registrationId
          ? { ...reg, status: 'rejected' as const }
          : reg
      ));
      
      toast({
        title: "Success",
        description: "Registration rejected successfully",
      });
      
      setSelectedRegistration(null);
      setRegistrationToReject(null);
    } catch (err: any) {
      console.error('Error rejecting registration:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to reject registration",
        variant: "destructive",
      });
    }
  };

  // Get session details for a registration
  const getSessionDetails = (sessionIds: string[]) => {
    if (!event?.sessions) return [];
    return sessionIds
      .map(sessionId => event.sessions.find(session => session._id === sessionId))
      .filter(session => session)
      .map(session => ({
        title: session!.title,
        date: new Date(session!.date),
        startTime: session!.startTime,
        endTime: session!.endTime
      }));
  };

  // Print functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Event Registrations - ${event?.title}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 1cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .event-details {
              margin-bottom: 30px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            .event-details h2 {
              margin: 0 0 15px 0;
              color: #333;
            }
            .event-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            }
            .event-info div {
              display: flex;
              align-items: center;
            }
            .event-info strong {
              min-width: 120px;
              display: inline-block;
            }
            .registrations-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .registrations-table th,
            .registrations-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              word-wrap: break-word;
              max-width: 200px;
            }
            .registrations-table th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .registrations-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .sessions-list {
              max-width: 250px;
              word-wrap: break-word;
              padding: 8px;
            }
            .status-badge {
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
            }
            .status-registered {
              background-color: #d4edda;
              color: #155724;
            }
            .status-cancelled {
              background-color: #f8d7da;
              color: #721c24;
            }
            .status-rejected {
              background-color: #f8d7da;
              color: #721c24;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Event Registrations Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="event-details">
            <h2>${event?.title}</h2>
            <div class="event-info">
              <div><strong>Date:</strong> ${event?.startDate ? format(new Date(event.startDate), "MMM d, yyyy") : 'N/A'}</div>
              <div><strong>Location:</strong> ${event?.location?.venue || 'N/A'}</div>
              <div><strong>Category:</strong> ${event?.category || 'N/A'}</div>
              <div><strong>Target Group:</strong> ${event?.targetGroup || 'N/A'}</div>
              <div><strong>Total Sessions:</strong> ${event?.sessions?.length || 0}</div>
              <div><strong>Total Registrations:</strong> ${filteredRegistrations.length}</div>
            </div>
          </div>
          
          <table class="registrations-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Participant Name</th>
                <th>Mobile Number</th>
                <th>Email</th>
                <th>Sessions Registered (Date & Time)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRegistrations.map((registration, index) => {
                const sessionDetails = getSessionDetails(registration.sessions);
                const sessionsHtml = sessionDetails.length > 0 
                  ? sessionDetails.map(session => 
                      `<div style="margin-bottom: 8px; padding: 4px; border-left: 3px solid #3b82f6; background-color: #f8fafc;">
                        <div style="font-weight: bold; font-size: 11px; color: #1f2937;">${session.title}</div>
                        <div style="font-size: 10px; color: #6b7280;">${format(session.date, "MMM d, yyyy")} • ${session.startTime} - ${session.endTime}</div>
                      </div>`
                    ).join('')
                  : 'No sessions selected';
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${registration.attendee.firstName} ${registration.attendee.lastName}</td>
                    <td>${registration.attendee.phone}</td>
                    <td>${registration.attendee.email || '-'}</td>
                    <td class="sessions-list">${sessionsHtml}</td>
                    <td><span class="status-badge status-${registration.status}">${registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Zubin Foundation Event Management System</p>
            <p>This report contains ${filteredRegistrations.length} registration(s)</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  type RegistrationStatus = "registered" | "cancelled" | "rejected";

  const getStatusVariant = (status: RegistrationStatus) => {
    switch (status) {
      case "registered":
        return "default";
      case "cancelled":
        return "destructive";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusClassName = (status: RegistrationStatus) => {
    switch (status) {
      case "registered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rejected":
        return "bg-red-100 text-red-800";
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading registrations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate("/manage/events-builder")}>Back to Events</Button>
        </div>
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
                    {format(new Date(event.startDate), "MMM d, yyyy")}
                    {event.startDate !== event.endDate && ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
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
            <CardTitle>
              Registrations ({filteredRegistrations.length})
            </CardTitle>
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
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              {canSendWhatsApp && registeredParticipantsCount > 0 && (
                <Button
                  onClick={() => setShowWhatsAppDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send WhatsApp
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {registrations.length === 0 ? "No registrations found for this event." : "No registrations match your search criteria."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Sessions Registered (with Date & Time)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => {
                    const sessionDetails = getSessionDetails(registration.sessions);
                    return (
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
                          <div className="max-w-xs">
                            {sessionDetails.length > 0 ? (
                              <div className="space-y-2">
                                {sessionDetails.map((session, index) => (
                                  <div key={index} className="border rounded p-2 bg-gray-50 mb-2">
                                    <div className="font-medium text-xs text-gray-900 mb-1">
                                      {session.title}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {format(session.date, "MMM d, yyyy")} • {session.startTime} - {session.endTime}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">No sessions selected</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(registration.status)}
                            className={getStatusClassName(registration.status)}
                          >
                            {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                          </Badge>
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
                            {registration.status !== "cancelled" && registration.status !== "rejected" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setRegistrationToReject(registration)}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Registration</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to reject the registration for{" "}
                                      <strong>{registration.attendee.firstName} {registration.attendee.lastName}</strong>?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setRegistrationToReject(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRejectRegistration(registration._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Reject Registration
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
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

      {/* WhatsApp Message Dialog */}
      {showWhatsAppDialog && (
        <WhatsAppMessageDialog
          isOpen={showWhatsAppDialog}
          onClose={() => setShowWhatsAppDialog(false)}
          eventTitle={event.title}
          participantCount={registeredParticipantsCount}
          onSendMessage={handleSendWhatsAppMessage}
        />
      )}
    </div>
  );
} 