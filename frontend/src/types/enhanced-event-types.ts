// Event types
export interface ZubinEvent {
    eventId: string
    eventTitle: string
    location: string
    date: string
    startTime: string
    endTime: string
    category: string
    targetGroup: string
    capacity: number
    registeredCount: number
    imageUrl?: string
    eventDetails: string
    associatedRegistrationForm: RegistrationForm
}
  
// Registration form types
export interface RegistrationForm {
  formId: string
  formTitle: string
  formCategory: string
  formFields: FormField[]
}
  
export interface FormField {
  fieldId: string
  fieldLabel: string
  fieldType: "text" | "email" | "tel" | "dropdown" | "checkbox" | "textarea" | "date"
  isRequired: boolean
  placeholder?: string
  helpText?: string
  options?: string[] // For dropdown fields
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    message?: string
  }
}
  
// Registration submission types
export interface EventRegistration {
  registrationId: string
  eventId: string
  submittedAt: string
  status: "pending" | "confirmed" | "cancelled"
  formData: Record<string, any>
}
  
  // Mock storage for registrations
  export const registrationStore: Record<string, EventRegistration[]> = {}
  
  // Function to save a registration
  export function saveEventRegistration(registration: EventRegistration): {
    success: boolean
    message: string
    data?: EventRegistration
    error?: string
  } {
    try {
      // In a real app, this would be an API call
      if (!registrationStore[registration.eventId]) {
        registrationStore[registration.eventId] = []
      }
  
      registrationStore[registration.eventId].push(registration)
  
      return {
        success: true,
        message: "Registration submitted successfully!",
        data: registration,
      }
    } catch (error) {
      console.error("Error saving registration:", error)
      return {
        success: false,
        message: "Failed to submit registration",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
  
  // Function to generate a unique ID
  export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  