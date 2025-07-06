/**
 * SimplifiedFormBuilder - Clean, maintainable, and fully functional dynamic form builder.
 * Features:
 * - Add/reorder sections (top-level only)
 * - Add fields to sections
 * - Edit all properties of sections/fields
 * - Auto-select and open properties after adding
 * - Minimal, clear state and logic
 * - Modern, easy-to-read code
 */

import type React from "react"
import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, GripVertical, Trash2, Copy, ChevronDown, ChevronRight, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { formService } from "@/services/formService"
import { FormSuccessModal } from "./form-success-modal"
import { RegistrationForm } from "@/types/form-types"

// --- Types and constants ---
const formBuilderSchema = z.object({
  title: z.string().min(2, "Form title must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
})
type FormBuilderValues = z.infer<typeof formBuilderSchema>

const categories = [
  { value: "registration", label: "Registration" },
  { value: "feedback", label: "Feedback" },
  { value: "survey", label: "Survey" },
  { value: "application", label: "Application" },
  { value: "contact", label: "Contact" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
]

const fieldTypes = [
  { id: "text", label: "Text Input", icon: "📝" },
  { id: "textarea", label: "Text Area", icon: "📄" },
  { id: "email", label: "Email", icon: "📧" },
  { id: "number", label: "Number", icon: "🔢" },
  { id: "dropdown", label: "Dropdown", icon: "📋" },
  { id: "radio", label: "Radio Buttons", icon: "🔘" },
  { id: "checkbox", label: "Checkboxes", icon: "☑️" },
  { id: "date", label: "Date Picker", icon: "📅" },
  { id: "file", label: "File Upload", icon: "📁" },
]

export interface FormFieldType {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
  parentId?: string | null
  isExpanded?: boolean
  children?: string[]
}

interface SimplifiedFormBuilderProps {
  onClose: () => void
  onSave: (data: any) => void
  formId?: string | null
  defaultValues?: Partial<FormBuilderValues>
  defaultFields?: FormFieldType[]
}

// --- Main Component ---
export default function SimplifiedFormBuilder({
  onClose,
  onSave,
  formId,
  defaultValues,
  defaultFields = [],
}: SimplifiedFormBuilderProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("fields")
  const [fields, setFields] = useState<FormFieldType[]>(defaultFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [nextFieldId, setNextFieldId] = useState(defaultFields.length + 1)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedForm, setSavedForm] = useState<RegistrationForm | null>(null)

  // Form for form details
  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      category: "",
    },
  })

  // Get selected field
  const selectedField = selectedFieldId ? fields.find(field => field.id === selectedFieldId) : null

  // --- Section/Field Operations ---
  const addSection = useCallback((e?: React.MouseEvent) => {
    // Prevent form submission if this is called from a button inside a form
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const newSection: FormFieldType = {
      id: `section_${nextFieldId}`,
      type: "section",
      label: "New Section",
      required: false,
      children: [],
      isExpanded: true,
    }
    
    setFields(prev => [...prev, newSection])
    setNextFieldId(prev => prev + 1)
    setSelectedFieldId(newSection.id)
    setExpandedSections(prev => ({ ...prev, [newSection.id]: true }))
    setActiveTab("properties")
  }, [nextFieldId])

  const addFieldToSection = useCallback((sectionId: string, fieldType: string) => {
    const newField: FormFieldType = {
      id: `field_${nextFieldId}`,
      type: fieldType,
      label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`,
      required: false,
      parentId: sectionId,
      options: ["Option 1", "Option 2"]
    }
    setFields(prev => {
      const updatedFields = [...prev]
      const sectionIndex = updatedFields.findIndex(f => f.id === sectionId)
      if (sectionIndex !== -1) {
        updatedFields[sectionIndex] = {
          ...updatedFields[sectionIndex],
          children: [...(updatedFields[sectionIndex].children || []), newField.id]
        }
      }
      return [...updatedFields, newField]
    })
    setNextFieldId(prev => prev + 1)
    setSelectedFieldId(newField.id)
    setActiveTab("properties")
  }, [nextFieldId])

  const updateField = useCallback((id: string, updates: Partial<FormFieldType>) => {
    setFields(prev => prev.map(field => field.id === id ? { ...field, ...updates } : field))
  }, [])

  const deleteField = useCallback((id: string) => {
    const fieldToDelete = fields.find(field => field.id === id)
    if (!fieldToDelete) return
    const idsToDelete = new Set([id])
    if (fieldToDelete.type === "section" && fieldToDelete.children) {
      fieldToDelete.children.forEach(childId => idsToDelete.add(childId))
    }
    setFields(prev => prev.filter(field => !idsToDelete.has(field.id)))
    if (selectedFieldId === id || idsToDelete.has(selectedFieldId || "")) {
      setSelectedFieldId(null)
    }
  }, [fields, selectedFieldId])

  const duplicateField = useCallback((id: string) => {
    const fieldToDuplicate = fields.find(field => field.id === id)
    if (!fieldToDuplicate) return
    const newField = {
      ...fieldToDuplicate,
      id: `field_${nextFieldId}`,
      label: `${fieldToDuplicate.label} (Copy)`,
      children: fieldToDuplicate.type === "section" ? [] : undefined,
    }
    setFields(prev => [...prev, newField])
    setNextFieldId(prev => prev + 1)
    setSelectedFieldId(newField.id)
    setActiveTab("properties")
  }, [fields, nextFieldId])

  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }, [])

  // --- Drag and Drop ---
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    const topLevelFields = fields.filter(field => !field.parentId)
    const reorderedFields = Array.from(topLevelFields)
    const [movedItem] = reorderedFields.splice(sourceIndex, 1)
    reorderedFields.splice(destinationIndex, 0, movedItem)
    setFields(prev => {
      const fieldsWithParents = prev.filter(field => field.parentId)
      return [...reorderedFields, ...fieldsWithParents]
    })
  }, [fields])

  // --- Backend Transform ---
  const transformToBackendFormat = useCallback((fields: FormFieldType[]) => {
    const sections: any[] = []
    let sectionOrder = 1
    const sectionFields = fields.filter(field => field.type === "section")
    sectionFields.forEach(sectionField => {
      const sectionChildren = fields.filter(field => field.parentId === sectionField.id)
      const transformedFields = sectionChildren.map((field, index) => ({
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        helpText: field.description,
        options: field.options,
        order: index + 1
      }))
      sections.push({
        title: sectionField.label,
        description: sectionField.description,
        fields: transformedFields,
        order: sectionOrder++
      })
    })
    return sections
  }, [])

  // --- Form Submission ---
  const onSubmit = useCallback(async (data: FormBuilderValues) => {
    if (fields.length === 0) {
      toast({ title: "Error", description: "Please add at least one section to your form", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const sections = transformToBackendFormat(fields)
      const formData = {
        title: data.title,
        description: data.description || "",
        sections: sections,
        isActive: true
      }
      const savedForm = await formService.createForm(formData)
      setSavedForm(savedForm)
      setShowSuccessModal(true)
      toast({ title: "Success", description: "Form saved successfully" })
      onSave(savedForm)
    } catch (error) {
      console.error("Error saving form:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save form", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }, [fields, transformToBackendFormat, onSave, toast])

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    setSavedForm(null)
    onClose()
  }

  // --- Properties Panel ---
  const renderPropertiesPanel = () => {
    if (!selectedField) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a field to edit its properties</p>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Properties: {selectedField.type}</h4>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFieldId(null)}>✕</Button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Label</label>
            <Input value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })} placeholder="Field label" />
          </div>
          {selectedField.type !== "section" && (
            <>
              <div>
                <label className="text-sm font-medium">Placeholder</label>
                <Input value={selectedField.placeholder || ""} onChange={e => updateField(selectedField.id, { placeholder: e.target.value })} placeholder="Placeholder text" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={selectedField.description || ""} onChange={e => updateField(selectedField.id, { description: e.target.value })} placeholder="Help text for this field" rows={2} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id={`required-${selectedField.id}`} checked={selectedField.required} onCheckedChange={checked => updateField(selectedField.id, { required: checked as boolean })} />
                <label htmlFor={`required-${selectedField.id}`} className="text-sm">Required field</label>
              </div>
            </>
          )}
          {(selectedField.type === "dropdown" || selectedField.type === "radio" || selectedField.type === "checkbox") && (
            <div>
              <label className="text-sm font-medium">Options</label>
              <Textarea value={selectedField.options?.join("\n") || ""} onChange={e => { const options = e.target.value.split("\n").filter(option => option.trim()); updateField(selectedField.id, { options }) }} placeholder="Option 1\nOption 2\nOption 3" rows={4} />
              <p className="text-xs text-muted-foreground mt-1">Enter each option on a new line</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Render Field/Section ---
  const renderField = (field: FormFieldType, index: number) => {
    const isSection = field.type === "section"
    const isExpanded = expandedSections[field.id] || false
    const isSelected = selectedFieldId === field.id
    return (
      <Draggable key={field.id} draggableId={field.id} index={index}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("border rounded-lg mb-3", isSelected ? "ring-2 ring-primary" : "border-gray-200") }>
            <div className="flex items-center p-3 bg-gray-50 rounded-t-lg">
              <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
              {isSection && (
                <Button type="button" variant="ghost" size="sm" className="p-1 mr-1" onClick={() => toggleSectionExpansion(field.id)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              <span className="flex-1 text-sm font-medium cursor-pointer" onClick={() => { setSelectedFieldId(field.id); setActiveTab("properties") }}>{field.label}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => duplicateField(field.id)}><Copy className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => deleteField(field.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            {/* Section children */}
            {isSection && isExpanded && field.children && field.children.length > 0 && (
              <div className="p-3 bg-white border-t">
                <div className="space-y-2">
                  {field.children.map(childId => {
                    const childField = fields.find(f => f.id === childId)
                    if (!childField) return null
                    const isChildSelected = selectedFieldId === childField.id
                    return (
                      <div key={childField.id} className={cn("flex items-center p-2 border rounded cursor-pointer", isChildSelected ? "ring-2 ring-primary" : "border-gray-200") } onClick={() => { setSelectedFieldId(childField.id); setActiveTab("properties") }}>
                        <span className="flex-1 text-sm">{childField.label}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteField(childField.id) }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )
                  })}
                </div>
                <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={() => { setSelectedFieldId(field.id); setActiveTab("fields") }}><Plus className="h-4 w-4 mr-1" />Add Field</Button>
              </div>
            )}
          </div>
        )}
      </Draggable>
    )
  }

  // --- Render ---
  const topLevelFields = fields.filter(field => !field.parentId)
  return (
    <>
      <div className="bg-background rounded-lg shadow-sm p-6 w-full">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Create New Form</h2>
            <p className="text-muted-foreground">Design your form by adding sections and fields.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Details */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold">Form Details</h3>
                      <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Form Title *</FormLabel>
                          <FormControl><Input placeholder="Enter form title" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea placeholder="Form description" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>
                {/* Form Builder */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Form Structure</h3>
                        <Button type="button" onClick={addSection} size="sm"><Plus className="h-4 w-4 mr-1" />Add Section</Button>
                      </div>
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="fields">Fields</TabsTrigger>
                          <TabsTrigger value="properties">Properties</TabsTrigger>
                        </TabsList>
                        <TabsContent value="fields" className="mt-4">
                          {topLevelFields.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground"><p>No sections yet. Click "Add Section" to get started.</p></div>
                          ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                              <Droppable droppableId="form-fields">
                                {(provided) => (
                                  <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {topLevelFields.map((field, index) => renderField(field, index))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          )}
                          {/* Add field to selected section */}
                          {selectedField?.type === "section" && (
                            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                              <h4 className="font-medium mb-2">Add field to: {selectedField.label}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {fieldTypes.map((type) => (
                                  <Button key={type.id} type="button" variant="outline" size="sm" onClick={() => addFieldToSection(selectedField.id, type.id)}><span className="mr-1">{type.icon}</span>{type.label}</Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="properties" className="mt-4">{renderPropertiesPanel()}</TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* Form Actions */}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Form"}</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      {/* Success Modal */}
      <FormSuccessModal isOpen={showSuccessModal} onClose={handleSuccessModalClose} form={savedForm} />
    </>
  )
} 