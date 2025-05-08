import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { DynamicFormField } from "@/components/events/dynamic-form-field"
import {
  type RegistrationForm,
  type EventRegistration,
  saveEventRegistration,
  generateId,
} from "@/types/enhanced-event-types"
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

    form.formFields.forEach((field) => {
      // Skip validation for non-required empty fields
      if (!field.isRequired && (formValues[field.fieldId] === undefined || formValues[field.fieldId] === "")) {
        return
      }

      // Required field validation
      if (field.isRequired && (formValues[field.fieldId] === undefined || formValues[field.fieldId] === "")) {
        newErrors[field.fieldId] = `${field.fieldLabel} is required`
        isValid = false
        return
      }

      // Pattern validation for text, email, tel
      if (
        field.validation?.pattern &&
        ["text", "email", "tel"].includes(field.fieldType) &&
        formValues[field.fieldId]
      ) {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(formValues[field.fieldId])) {
          newErrors[field.fieldId] = field.validation.message || "Invalid format"
          isValid = false
        }
      }

      // Length validation
      if (
        field.validation?.minLength &&
        ["text", "textarea"].includes(field.fieldType) &&
        formValues[field.fieldId]?.length < field.validation.minLength
      ) {
        newErrors[field.fieldId] = `${field.fieldLabel} must be at least ${field.validation.minLength} characters long`
        isValid = false
      }

      if (
        field.validation?.maxLength &&
        ["text", "textarea"].includes(field.fieldType) &&
        formValues[field.fieldId]?.length > field.validation.maxLength
      ) {
        newErrors[field.fieldId] = `${field.fieldLabel} cannot exceed ${field.validation.maxLength} characters`
        isValid = false
      }

      // Checkbox validation
      if (field.fieldType === "checkbox" && field.isRequired && !formValues[field.fieldId]) {
        newErrors[field.fieldId] = `You must agree to ${field.fieldLabel.toLowerCase()}`
        isValid = false
      }
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
        registrationId: generateId(),
        eventId,
        submittedAt: new Date().toISOString(),
        status: "pending",
        formData: { ...formValues },
      }

      // Save registration
      const result = saveEventRegistration(registration)

      if (result.success) {
        toast({
          variant: "default",
          title: "Registration Successful",
          description: "Your registration has been submitted successfully.",
        })
        onSuccess()
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.message || "There was an error processing your registration.",
        })
      }
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
        <CardTitle>{form.formTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.formFields.map((field) =>
            field.fieldType === "checkbox" ? null : (
              <DynamicFormField
                key={field.fieldId}
                field={field}
                value={formValues[field.fieldId]}
                onChange={handleFieldChange}
                error={errors[field.fieldId]}
              />
            ),
          )}

          {/* Render checkbox fields at the end */}
          {form.formFields
            .filter((field) => field.fieldType === "checkbox")
            .map((field) => (
              <DynamicFormField
                key={field.fieldId}
                field={field}
                value={formValues[field.fieldId]}
                onChange={handleFieldChange}
                error={errors[field.fieldId]}
              />
            ))}

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
