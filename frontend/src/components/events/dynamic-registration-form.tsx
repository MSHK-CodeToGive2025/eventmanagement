import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { DynamicFormField } from "@/components/events/dynamic-form-field"
import { generateId } from "@/types/enhanced-event-types"
import { RegistrationForm } from "@/types/form-types"
import { EventRegistration } from "@/services/registrationService"
import { useToast } from "@/hooks/use-toast"

interface DynamicRegistrationFormProps {
  eventId: string
  form: RegistrationForm
  onSuccess: () => void
  onCancel: () => void
}

export function DynamicRegistrationForm({ eventId, form, onSuccess, onCancel }: DynamicRegistrationFormProps) {
  const { toast } = useToast()
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when field is edited
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    form.sections.forEach((section) => {
      section.fields.forEach((field) => {
        // Skip validation for non-required empty fields
        if (!field.required && (formValues[field._id] === undefined || formValues[field._id] === "")) {
          return
        }

        // Required field validation
        if (field.required && (formValues[field._id] === undefined || formValues[field._id] === "")) {
          newErrors[field._id] = `${field.label} is required`
          isValid = false
          return
        }

        // Pattern validation for text, email, phone
        if (
          field.validation?.pattern &&
          ["text", "email", "phone"].includes(field.type) &&
          formValues[field._id]
        ) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(formValues[field._id])) {
            newErrors[field._id] = field.validation.message || "Invalid format"
            isValid = false
          }
        }

        // Length validation
        if (
          field.validation?.minLength &&
          ["text", "textarea"].includes(field.type) &&
          formValues[field._id]?.length < field.validation.minLength
        ) {
          newErrors[field._id] = `${field.label} must be at least ${field.validation.minLength} characters long`
          isValid = false
        }

        if (
          field.validation?.maxLength &&
          ["text", "textarea"].includes(field.type) &&
          formValues[field._id]?.length > field.validation.maxLength
        ) {
          newErrors[field._id] = `${field.label} cannot exceed ${field.validation.maxLength} characters`
          isValid = false
        }

        // Checkbox validation
        if (field.type === "checkbox" && field.required && !formValues[field._id]) {
          newErrors[field._id] = `You must agree to ${field.label.toLowerCase()}`
          isValid = false
        }
      })
    })

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please correct the errors in the form before submitting.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create registration data
      const registration: EventRegistration = {
        _id: generateId(),
        eventId,
        attendee: {
          firstName: "",
          lastName: "",
          phone: "",
        },
        sessions: [],
        formResponses: Object.entries(formValues).map(([fieldId, response]) => ({
          sectionId: "",
          fieldId,
          response,
        })),
        status: "registered",
        registeredAt: new Date().toISOString(),
      }

      // TODO: Implement actual registration saving
      console.log("Registration data:", registration)

      // For now, assume success
      toast({
        variant: "default",
        title: "Registration Successful",
        description: "Your registration has been submitted successfully.",
      })
      onSuccess()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "There was an unexpected error. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.sections.map((section) =>
            section.fields.map((field) =>
              field.type === "checkbox" ? null : (
                <DynamicFormField
                  key={field._id}
                  field={field}
                  value={formValues[field._id]}
                  onChange={handleFieldChange}
                  error={errors[field._id]}
                />
              ),
            ),
          )}

          {/* Render checkbox fields at the end */}
          {form.sections.map((section) =>
            section.fields
              .filter((field) => field.type === "checkbox")
              .map((field) => (
                <DynamicFormField
                  key={field._id}
                  field={field}
                  value={formValues[field._id]}
                  onChange={handleFieldChange}
                  error={errors[field._id]}
                />
              )),
          )}

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please correct the errors above before submitting.</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
