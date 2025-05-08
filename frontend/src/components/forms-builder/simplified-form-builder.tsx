/**
 * SimplifiedFormBuilder Component
 * 
 * A drag-and-drop form builder that allows users to create and customize forms with various field types.
 * Features include:
 * - Drag and drop field reordering
 * - Nested sections for organizing fields
 * - Field property editing
 * - Form validation
 * - Field duplication and deletion
 */

import type React from "react"

import { useState, useCallback, useEffect } from "react"
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
import { Plus, GripVertical, Trash2, Copy, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { FieldEditor } from "./field-editor"
import { FieldPreview } from "./field-preview"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Form validation schema using Zod
const formBuilderSchema = z.object({
  title: z.string().min(2, {
    message: "Form title is required and must be at least 2 characters.",
  }),
  description: z.string().optional(),
  category: z.string().min(1, {
    message: "Category is required.",
  }),
})

type FormBuilderValues = z.infer<typeof formBuilderSchema>

// Predefined form categories for selection
const predefinedCategories = [
  { value: "registration", label: "Registration" },
  { value: "feedback", label: "Feedback" },
  { value: "survey", label: "Survey" },
  { value: "application", label: "Application" },
  { value: "contact", label: "Contact" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
]

// Available field types that can be added to the form
const fieldTypes = [
  { id: "text", label: "Text Input", icon: <Plus className="h-4 w-4" /> },
  { id: "textarea", label: "Text Area", icon: <Plus className="h-4 w-4" /> },
  { id: "email", label: "Email", icon: <Plus className="h-4 w-4" /> },
  { id: "number", label: "Number", icon: <Plus className="h-4 w-4" /> },
  { id: "dropdown", label: "Dropdown", icon: <Plus className="h-4 w-4" /> },
  { id: "multiselect", label: "Multi-Select", icon: <Plus className="h-4 w-4" /> },
  { id: "radio", label: "Radio Buttons", icon: <Plus className="h-4 w-4" /> },
  { id: "checkbox", label: "Checkboxes", icon: <Plus className="h-4 w-4" /> },
  { id: "date", label: "Date Picker", icon: <Plus className="h-4 w-4" /> },
  { id: "file", label: "File Upload", icon: <Plus className="h-4 w-4" /> },
  { id: "section", label: "Section", icon: <Plus className="h-4 w-4" /> },
]

// Type definition for form fields
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

// Props interface for the form builder component
interface SimplifiedFormBuilderProps {
  onClose: () => void
  onSave: (data: any) => void
  formId?: string | null
  defaultValues?: Partial<FormBuilderValues>
  defaultFields?: FormFieldType[]
}

export default function SimplifiedFormBuilder({
  onClose,
  onSave,
  formId,
  defaultValues,
  defaultFields = [],
}: SimplifiedFormBuilderProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("fields")
  const [fields, setFields] = useState<FormFieldType[]>(
    defaultFields.map((field) => ({
      ...field,
      parentId: field.parentId || null,
      isExpanded: field.isExpanded !== undefined ? field.isExpanded : true,
      children: field.children || [],
    })),
  )
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [nextFieldId, setNextFieldId] = useState(defaultFields.length + 1)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // Initialize form with react-hook-form
  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      category: "",
    },
  })

  // Initialize expanded sections on component mount
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {}
    fields.forEach((field) => {
      if (field.type === "section") {
        initialExpandedState[field.id] = true
      }
    })
    setExpandedSections(initialExpandedState)
  }, [])

  // Form submission handler
  const onSubmit = useCallback(
    (data: FormBuilderValues) => {
      if (fields.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one field to your form",
          variant: "destructive",
        })
        return
      }

      // Create the form data object
      const formData = {
        ...data,
        fields,
        id: formId || `form_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log("Form saved:", formData)
      
      toast({
        title: "Form saved",
        description: "Your form has been saved successfully",
      })

      onSave(formData)
    },
    [fields, onSave, toast, formId],
  )

  // Toggle section expansion state
  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }, [])

  // Add a new field to the form
  const addField = useCallback(
    (type: string, parentId: string | null = null) => {
      const newField: FormFieldType = {
        id: `field_${nextFieldId}`,
        type,
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
        required: false,
        parentId,
        options:
          type === "dropdown" || type === "multiselect" || type === "radio" || type === "checkbox"
            ? []
            : undefined,
        children: type === "section" ? [] : undefined,
        isExpanded: type === "section" ? true : undefined,
      }

      setNextFieldId((prevId) => prevId + 1)

      // Initialize section as expanded
      if (type === "section") {
        setExpandedSections((prev) => ({
          ...prev,
          [newField.id]: true,
        }))
      }

      // Add field to parent section if specified
      if (parentId) {
        setFields((prevFields) => {
          const updatedFields = [...prevFields]
          const parentIndex = updatedFields.findIndex((f) => f.id === parentId)

          if (parentIndex !== -1 && updatedFields[parentIndex].children) {
            updatedFields[parentIndex].children = [...(updatedFields[parentIndex].children || []), newField.id]
          }

          return [...updatedFields, newField]
        })
      } else {
        setFields((prevFields) => [...prevFields, newField])
      }

      setSelectedFieldId(newField.id)
      setActiveTab("properties")
    },
    [nextFieldId],
  )

  // Update field properties
  const updateField = useCallback((id: string, updates: Partial<FormFieldType>) => {
    setFields((prevFields) => prevFields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }, [])

  // Duplicate an existing field
  const duplicateField = useCallback(
    (id: string) => {
      const fieldToDuplicate = fields.find((field) => field.id === id)
      if (!fieldToDuplicate) return

      const newField = {
        ...fieldToDuplicate,
        id: `field_${nextFieldId}`,
        label: `${fieldToDuplicate.label} (Copy)`,
        children: fieldToDuplicate.type === "section" ? [] : undefined,
      }

      setNextFieldId((prevId) => prevId + 1)

      // Initialize duplicated section as expanded
      if (fieldToDuplicate.type === "section") {
        setExpandedSections((prev) => ({
          ...prev,
          [newField.id]: true,
        }))
      }

      // Add duplicated field to parent section if it exists
      if (newField.parentId) {
        setFields((prevFields) => {
          const updatedFields = [...prevFields]
          const parentIndex = updatedFields.findIndex((f) => f.id === newField.parentId)

          if (parentIndex !== -1 && updatedFields[parentIndex].children) {
            updatedFields[parentIndex].children = [...(updatedFields[parentIndex].children || []), newField.id]
          }

          return [...updatedFields, newField]
        })
      } else {
        setFields((prevFields) => [...prevFields, newField])
      }

      setSelectedFieldId(newField.id)
    },
    [fields, nextFieldId],
  )

  // Delete a field and its children if it's a section
  const deleteField = useCallback(
    (id: string) => {
      const fieldToDelete = fields.find((field) => field.id === id)
      if (!fieldToDelete) return

      // Collect all IDs to delete (including children)
      const idsToDelete = new Set<string>([id])

      if (fieldToDelete.type === "section" && fieldToDelete.children) {
        fieldToDelete.children.forEach((childId) => {
          idsToDelete.add(childId)

          // Delete nested children if they exist
          const childField = fields.find((f) => f.id === childId)
          if (childField?.type === "section" && childField.children) {
            childField.children.forEach((nestedChildId) => idsToDelete.add(nestedChildId))
          }
        })
      }

      // Update parent's children array if field has a parent
      if (fieldToDelete.parentId) {
        setFields((prevFields) => {
          const updatedFields = [...prevFields]
          const parentIndex = updatedFields.findIndex((f) => f.id === fieldToDelete.parentId)

          if (parentIndex !== -1 && updatedFields[parentIndex].children) {
            updatedFields[parentIndex].children = updatedFields[parentIndex].children?.filter(
              (childId) => childId !== id,
            )
          }

          return updatedFields.filter((field) => !idsToDelete.has(field.id))
        })
      } else {
        setFields((prevFields) => prevFields.filter((field) => !idsToDelete.has(field.id)))
      }

      if (selectedFieldId === id || idsToDelete.has(selectedFieldId || "")) {
        setSelectedFieldId(null)
      }
    },
    [fields, selectedFieldId],
  )

  // Handle drag and drop reordering of fields
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const sourceIndex = result.source.index
      const destinationIndex = result.destination.index
      const sourceDroppableId = result.source.droppableId
      const destinationDroppableId = result.destination.droppableId

      // Handle reordering within the same list
      if (sourceDroppableId === destinationDroppableId) {
        if (sourceDroppableId === "form-fields") {
          // Reorder main form fields
          const reorderedFields = Array.from(fields.filter((f) => !f.parentId))
          const [movedItem] = reorderedFields.splice(sourceIndex, 1)
          reorderedFields.splice(destinationIndex, 0, movedItem)

          setFields((prevFields) => {
            const fieldsWithParents = prevFields.filter((f) => f.parentId)
            return [...reorderedFields, ...fieldsWithParents]
          })
        } else {
          // Reorder fields within a section
          const sectionId = sourceDroppableId.replace("section-", "")
          const sectionFields = fields.filter((f) => f.parentId === sectionId)
          const reorderedSectionFields = Array.from(sectionFields)
          const [movedItem] = reorderedSectionFields.splice(sourceIndex, 1)
          reorderedSectionFields.splice(destinationIndex, 0, movedItem)

          // Update section's children order
          const sectionField = fields.find((f) => f.id === sectionId)
          if (sectionField && sectionField.children) {
            const newChildrenOrder = reorderedSectionFields.map((f) => f.id)

            setFields((prevFields) => {
              return prevFields.map((field) => {
                if (field.id === sectionId) {
                  return { ...field, children: newChildrenOrder }
                }
                return field
              })
            })
          }
        }
      } else {
        // Handle moving between different lists
        const sourceParentId = sourceDroppableId === "form-fields" ? null : sourceDroppableId.replace("section-", "")
        const destParentId =
          destinationDroppableId === "form-fields" ? null : destinationDroppableId.replace("section-", "")

        // Get fields for source and destination
        const sourceFields = sourceParentId
          ? fields.filter((f) => f.parentId === sourceParentId)
          : fields.filter((f) => !f.parentId)

        const destFields = destParentId
          ? fields.filter((f) => f.parentId === destParentId)
          : fields.filter((f) => !f.parentId)

        const fieldToMove = sourceFields[sourceIndex]

        // Update field's parent
        setFields((prevFields) => {
          return prevFields.map((field) => {
            if (field.id === fieldToMove.id) {
              return { ...field, parentId: destParentId }
            }
            return field
          })
        })

        // Update children arrays of both source and destination parents
        if (sourceParentId) {
          const sourceParent = fields.find((f) => f.id === sourceParentId)
          if (sourceParent && sourceParent.children) {
            setFields((prevFields) => {
              return prevFields.map((field) => {
                if (field.id === sourceParentId) {
                  return {
                    ...field,
                    children: field.children?.filter((id) => id !== fieldToMove.id),
                  }
                }
                return field
              })
            })
          }
        }

        if (destParentId) {
          const destParent = fields.find((f) => f.id === destParentId)
          if (destParent && destParent.children) {
            const newChildren = [...(destParent.children || [])]
            newChildren.splice(destinationIndex, 0, fieldToMove.id)

            setFields((prevFields) => {
              return prevFields.map((field) => {
                if (field.id === destParentId) {
                  return { ...field, children: newChildren }
                }
                return field
              })
            })
          }
        }
      }
    },
    [fields],
  )

  // Get the currently selected field
  const selectedField = selectedFieldId ? fields.find((field) => field.id === selectedFieldId) : null

  // Prevent form submission on Enter key in options input
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (
      e.key === "Enter" &&
      e.target instanceof HTMLTextAreaElement &&
      (e.target.className.includes("options-input") || e.target.dataset.optionsInput === "true")
    ) {
      e.preventDefault()
    }
  }

  // Render a field and its children (if it's a section)
  const renderField = (field: FormFieldType, index: number, parentId: string | null = null) => {
    const isSection = field.type === "section"
    const isExpanded = expandedSections[field.id] || false

    return (
      <Draggable key={field.id} draggableId={field.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "mb-4 border rounded-md shadow-sm",
              selectedFieldId === field.id ? "ring-2 ring-primary" : "border-gray-200",
            )}
          >
            {/* Field header with controls */}
            <div className="flex items-center bg-white border-b rounded-t-md p-2">
              <div {...provided.dragHandleProps} className="cursor-move mr-2">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>

              {isSection && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-0 mr-1"
                  onClick={() => toggleSectionExpansion(field.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}

              <span
                className="text-sm font-medium flex-1 cursor-pointer"
                onClick={() => {
                  setSelectedFieldId(field.id)
                  setActiveTab("properties")
                }}
              >
                {field.type}: {field.label}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateField(field.id)
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteField(field.id)
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Field preview */}
            <FieldPreview field={field} isSelected={selectedFieldId === field.id} />

            {/* Render section children if expanded */}
            {isSection && isExpanded && field.children && field.children.length > 0 && (
              <div className="ml-6 pl-2 border-l-2 border-gray-200 mt-2">
                <Droppable droppableId={`section-${field.id}`}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {field.children?.map((childId, childIndex) => {
                        const childField = fields.find((f) => f.id === childId)
                        if (!childField) return null
                        return renderField(childField, childIndex, field.id)
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add field to section button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-sm"
                  onClick={() => setActiveTab("fields")}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Field to Section
                </Button>
              </div>
            )}
          </div>
        )}
      </Draggable>
    )
  }

  // Get top-level fields (those without a parent)
  const topLevelFields = fields.filter((field) => !field.parentId)

  return (
    <div className="bg-background rounded-lg shadow-sm p-6 w-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Create New Form</h2>
          <p className="text-muted-foreground">Design your form by adding and configuring fields.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleFormKeyDown}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h3 className="text-xl font-bold">Form Details</h3>

                    {/* Form title field */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">
                            Form Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter form title" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Form category field */}
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base font-medium">
                            Category <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {predefinedCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Form description field */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Form Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter form description" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Form fields section */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Form Fields</h4>

                      <div className="min-h-[300px] border-2 border-dashed border-gray-200 rounded-md p-4 bg-gray-50">
                        {fields.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Add form fields from the panel on the right
                          </div>
                        ) : (
                          <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="form-fields">
                              {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                  {topLevelFields.map((field, index) => renderField(field, index))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Form controls panel */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Form Controls</h3>

                    <Tabs
                      defaultValue="fields"
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="border p-2 rounded-md"
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="fields">Add Fields</TabsTrigger>
                        <TabsTrigger value="properties">Properties</TabsTrigger>
                      </TabsList>

                      {/* Add fields tab */}
                      <TabsContent value="fields" className="space-y-2 border p-3 rounded-md">
                        <div className="bg-muted p-2 rounded-md mb-2">
                          <p className="text-sm font-medium">
                            {selectedField && selectedField.type === "section"
                              ? `Add field to section: ${selectedField.label}`
                              : "Add field to form"}
                          </p>
                        </div>
                        {fieldTypes.map((type) => (
                          <Button
                            key={type.id}
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left h-10 mb-2"
                            onClick={() => {
                              if (selectedField && selectedField.type === "section") {
                                addField(type.id, selectedField.id)
                              } else {
                                addField(type.id)
                              }
                            }}
                          >
                            {type.icon}
                            <span className="ml-2">{type.label}</span>
                          </Button>
                        ))}
                      </TabsContent>

                      {/* Properties tab */}
                      <TabsContent value="properties" className="min-h-[400px] border p-3 rounded-md">
                        {selectedField ? (
                          <FieldEditor field={selectedField} onUpdate={updateField} />
                        ) : (
                          <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm font-medium">Select a field to edit its properties</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Click on any field in the form preview to select it
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Form action buttons */}
              <div className="w-full flex justify-start gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
                  Cancel
                </Button>
                <Button type="submit" className="h-12 px-6">
                  Save Form
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

