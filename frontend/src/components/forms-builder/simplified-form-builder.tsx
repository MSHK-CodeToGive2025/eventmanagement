/**
 * Revamped Form Builder - Simple, intuitive, and user-friendly
 * Features:
 * - Step-by-step workflow
 * - Simple section and field management
 * - Live preview
 * - Clean, modern UI
 * - Smooth user experience
 */

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { formService } from "@/services/formService"
import { RegistrationForm } from "@/types/form-types"
import { FormFieldRenderer } from "./form-field-renderer"

// --- Types and constants ---
const formBuilderSchema = z.object({
  title: z.string().min(2, "Form title must be at least 2 characters"),
  description: z.string().optional(),
})
type FormBuilderValues = z.infer<typeof formBuilderSchema>

const fieldTypes = [
  { id: "text", label: "Text Input", icon: "📝", description: "Single line text input" },
  { id: "textarea", label: "Text Area", icon: "📄", description: "Multi-line text input" },
  { id: "email", label: "Email", icon: "📧", description: "Email address input" },
  { id: "number", label: "Number", icon: "🔢", description: "Numeric input" },
  { id: "phone", label: "Phone", icon: "📞", description: "Phone number input" },
  { id: "dropdown", label: "Dropdown", icon: "📋", description: "Single selection from options" },
  { id: "radio", label: "Radio Buttons", icon: "🔘", description: "Single selection with radio buttons" },
  { id: "checkbox", label: "Checkboxes", icon: "☑️", description: "Multiple selections" },
  { id: "date", label: "Date Picker", icon: "📅", description: "Date selection" },
]

export interface FormFieldType {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
  sectionId: string
}

export interface FormSectionType {
  id: string
  title: string
  description?: string
  fields: FormFieldType[]
}

interface SimplifiedFormBuilderProps {
  onClose: () => void
  formId?: string | null
  defaultValues?: Partial<FormBuilderValues>
  defaultSections?: FormSectionType[]
}

// --- Main Component ---
export default function SimplifiedFormBuilder({
  onClose,
  formId,
  defaultValues,
  defaultSections = [],
}: SimplifiedFormBuilderProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [sections, setSections] = useState<FormSectionType[]>(defaultSections)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [nextId, setNextId] = useState(defaultSections.length + 1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({})

  // Form for form details
  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
    },
  })

  // --- Section Operations ---
  const addSection = useCallback(() => {
    const newSection: FormSectionType = {
      id: `section_${nextId}`,
      title: "New Section",
      description: "",
      fields: [],
    }
    setSections(prev => [...prev, newSection])
    setNextId(prev => prev + 1)
    setSelectedSectionId(newSection.id)
  }, [nextId])

  const updateSection = useCallback((sectionId: string, updates: Partial<FormSectionType>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ))
  }, [])

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId))
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
    }
  }, [selectedSectionId])

  // --- Field Operations ---
  const addField = useCallback((sectionId: string, fieldType: string) => {
    const newField: FormFieldType = {
      id: `field_${nextId}`,
      type: fieldType,
      label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      placeholder: "",
      required: false,
      sectionId,
      options: fieldType === "dropdown" || fieldType === "radio" || fieldType === "checkbox" 
        ? ["Option 1", "Option 2"] 
        : undefined
    }
    
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, fields: [...section.fields, newField] }
        : section
    ))
    setNextId(prev => prev + 1)
  }, [nextId])

  const updateField = useCallback((sectionId: string, fieldId: string, updates: Partial<FormFieldType>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { 
            ...section, 
            fields: section.fields.map(field => 
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : section
    ))
  }, [])

  const deleteField = useCallback((sectionId: string, fieldId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, fields: section.fields.filter(field => field.id !== fieldId) }
        : section
    ))
  }, [])

  // --- Navigation ---
  const nextStep = useCallback(async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger()
      if (!isValid) {
        return
      }
    }
    if (currentStep === 2 && sections.length === 0) {
      toast({ title: "Error", description: "Please add at least one section to your form", variant: "destructive" })
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }, [currentStep, form, sections.length, toast])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  // --- Backend Transform ---
  const transformToBackendFormat = useCallback((sections: FormSectionType[]) => {
    return sections.map((section, sectionIndex) => ({
      title: section.title,
      description: section.description,
      fields: section.fields.map((field, fieldIndex) => ({
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        helpText: field.description,
        options: field.options,
        order: fieldIndex + 1
      })),
      order: sectionIndex + 1
    }))
  }, [])

  // --- Form Submission ---
  const onSubmit = useCallback(async (data: FormBuilderValues) => {
    setIsSubmitting(true)
    try {
      const sectionsData = transformToBackendFormat(sections)
      const formData = {
        title: data.title,
        description: data.description || "",
        category: "registration",
        sections: sectionsData,
        isActive: true
      }
      
      if (formId) {
        await formService.updateForm(formId, formData)
        toast({ title: "Success", description: "Form updated successfully" })
      } else {
        await formService.createForm(formData)
        toast({ title: "Success", description: "Form created successfully" })
      }
      
      onClose()
    } catch (error) {
      console.error("Error saving form:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save form", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }, [sections, transformToBackendFormat, formId, toast])



  // --- Render Steps ---
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Form Details</CardTitle>
        <p className="text-muted-foreground">Start by giving your form a title and description.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Form Title *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Event Registration Form" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe what this form is for..." 
                rows={3}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Build Form Structure</CardTitle>
          <p className="text-muted-foreground">Add sections and fields to create your form.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Section title"
                      className="font-medium"
                    />
                    <Textarea
                      value={section.description || ""}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      placeholder="Section description (optional)"
                      rows={1}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSection(section.id)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                
                {/* Fields in this section */}
                <div className="space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium">{fieldTypes.find(t => t.id === field.type)?.icon}</span>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                            placeholder="Field label"
                            className="flex-1"
                          />
                          <Checkbox
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(section.id, field.id, { required: checked as boolean })}
                          />
                          <label htmlFor={`required-${field.id}`} className="text-sm">Required</label>
                        </div>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => updateField(section.id, field.id, { placeholder: e.target.value })}
                          placeholder="Placeholder text"
                          className="text-sm"
                        />
                        {(field.type === "dropdown" || field.type === "radio" || field.type === "checkbox") && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {field.options?.map((option, index) => (
                                <div key={index} className="flex items-center bg-gray-100 px-2 py-1 rounded text-sm">
                                  <span>{option}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = field.options?.filter((_, i) => i !== index) || []
                                      updateField(section.id, field.id, { options: newOptions })
                                    }}
                                    className="ml-2 text-gray-500 hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <Input
                              placeholder="Type option and press Enter"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const input = e.target as HTMLInputElement
                                  const value = input.value.trim()
                                  if (value && !field.options?.includes(value)) {
                                    const newOptions = [...(field.options || []), value]
                                    updateField(section.id, field.id, { options: newOptions })
                                    input.value = ''
                                  }
                                }
                              }}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteField(section.id, field.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add field button */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">Add a field to this section:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {fieldTypes.map((type) => (
                        <Button
                          key={type.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addField(section.id, type.id)}
                          className="justify-start"
                        >
                          <span className="mr-2">{type.icon}</span>
                          <span className="text-xs">{type.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add section button */}
            <Button
              type="button"
              variant="outline"
              onClick={addSection}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Section
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

    const renderStep3 = () => {
    const handlePreviewFieldChange = (fieldId: string, value: any) => {
      setPreviewValues(prev => ({ ...prev, [fieldId]: value }))
    }

    // Convert sections to the format expected by FormFieldRenderer
    const previewSections = sections.map(section => ({
      _id: section.id,
      title: section.title,
      description: section.description,
      fields: section.fields.map(field => ({
        _id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        helpText: field.description,
        options: field.options,
        validation: {}
      }))
    }))

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Preview & Save</CardTitle>
            <p className="text-muted-foreground">Review your form and save it when ready.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Form Preview */}
              <div className="border rounded-lg p-6 bg-white">
                <h3 className="text-xl font-semibold mb-2">{form.getValues("title") || "Form Title"}</h3>
                {form.getValues("description") && (
                  <p className="text-muted-foreground mb-6">{form.getValues("description")}</p>
                )}
                
                {previewSections.map((section) => (
                  <div key={section._id} className="mb-6">
                    <h4 className="text-lg font-medium mb-2">{section.title}</h4>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                    )}
                    <div className="space-y-4">
                      {section.fields.map((field) => (
                        <FormFieldRenderer
                          key={field._id}
                          field={field}
                          value={previewValues[field._id]}
                          onChange={handlePreviewFieldChange}
                          disableValidation={true}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Save button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : (formId ? "Update Form" : "Save Form")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    )
  }

  // --- Render ---
  return (
    <>
      <Form {...form}>
        <div className="bg-background rounded-lg shadow-sm p-6 w-full max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold">{formId ? "Edit Form" : "Create New Form"}</h2>
              <p className="text-muted-foreground">Build your registration form step by step</p>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step <= currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-gray-200 text-gray-500"
                  )}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={cn(
                      "w-12 h-0.5 mx-2",
                      step < currentStep ? "bg-primary" : "bg-gray-200"
                    )} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="min-h-[400px]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? onClose : prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentStep === 1 ? "Cancel" : "Previous"}
              </Button>
              
              {currentStep < 3 && (
                <Button type="button" onClick={() => nextStep()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Form>

    </>
  )
} 