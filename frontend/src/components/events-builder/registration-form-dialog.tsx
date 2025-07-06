import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { X, AlertTriangle } from "lucide-react"
import { RegistrationForm, FormSection, FormField } from "@/types/form-types"

interface RegistrationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  registration: {
    _id: string;
    eventId: string;
    attendee: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
    sessions: string[];
    formResponses: {
      sectionId: string;
      fieldId: string;
      response: any;
    }[];
    status: 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'waitlisted';
    registeredAt: string;
    cancelledAt?: string;
    notes?: string;
  };
  form: RegistrationForm;
  onReject: (registrationId: string) => void;
}

export default function RegistrationFormDialog({
  isOpen,
  onClose,
  registration,
  form,
  onReject,
}: RegistrationFormDialogProps) {
  // Helper function to find field details
  const findFieldDetails = (sectionId: string, fieldId: string) => {
    const section = form.sections.find(s => s._id === sectionId);
    if (!section) return null;
    return section.fields.find(f => f._id === fieldId);
  };

  // Helper function to format response value
  const formatResponseValue = (field: FormField | undefined, value: any) => {
    if (!field) return value;

    switch (field.type) {
      case 'checkbox':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'date':
        return value ? format(new Date(value), 'MMM d, yyyy') : value;
      default:
        return value;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Registration Form Details
          </DialogTitle>
        </DialogHeader>

        {/* Participant Information */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Participant Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">
                  {registration.attendee.firstName} {registration.attendee.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{registration.attendee.phone}</p>
              </div>
              {registration.attendee.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{registration.attendee.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-medium">
                  {format(new Date(registration.registeredAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Form Responses */}
          <div className="space-y-6">
            {form.sections.map((section) => {
              const sectionResponses = registration.formResponses.filter(
                (r) => r.sectionId === section._id
              );

              if (sectionResponses.length === 0) return null;

              return (
                <div key={section._id} className="space-y-3">
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-gray-500">{section.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sectionResponses.map((response) => {
                      const field = findFieldDetails(section._id, response.fieldId);
                      if (!field) return null;

                      return (
                        <div key={response.fieldId} className="space-y-1">
                          <p className="text-sm text-gray-500">{field.label}</p>
                          <p className="font-medium">
                            {formatResponseValue(field, response.response)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          {registration.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm">{registration.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                registration.status === "confirmed"
                  ? "default"
                  : registration.status === "pending"
                    ? "outline"
                    : registration.status === "cancelled"
                      ? "destructive"
                      : "secondary"
              }
              className={
                registration.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : registration.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : registration.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-purple-100 text-purple-800"
              }
            >
              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
            </Badge>
          </div>
          <div className="flex gap-2">
            {registration.status === "pending" && (
              <Button
                variant="destructive"
                onClick={() => onReject(registration._id)}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Reject Registration
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 