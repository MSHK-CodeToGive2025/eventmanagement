/**
 * SimplifiedFormBuilder Component
 * 
 * A drag-and-drop form builder that allows users to create and customize forms with various field types.
 * Features include:
 * - Drag and drop field reordering (only for top-level fields)
 * - Nested sections for organizing fields (fields within sections are static)
 * - Field property editing
 * - Form validation
 * - Field duplication and deletion
 * 
 * Drag and Drop Implementation:
 * - Only top-level fields (fields without a parent) can be dragged and reordered
 * - Fields within sections are static and cannot be reordered
 * - The drag handle (grip icon) is only shown for top-level fields
 * - Section children are rendered in a static order
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
import { FieldEditor } from "./field-editor"
import { FieldPreview } from "./field-preview"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Define the form schema
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

// Predefined categories
const predefinedCategories = [
  { value: "registration", label: "Registration" },
  { value: "feedback", label: "Feedback" },
  { value: "survey", label: "Survey" },
  { value: "application", label: "Application" },
  { value: "contact", label: "Contact" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
]

// Define field types
const fieldTypes = [
  { id: "section", label: "Section", icon: <Plus className="h-4 w-4" /> },
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
]

// Define field interface
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
  const [customCategory, setCustomCategory] = useState("")
  const [open, setOpen] = useState(false)

  // Initialize the form
  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      category: "",
    },
  })

  // Initialize expanded sections
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {}
    fields.forEach((field) => {
      if (field.type === "section") {
        initialExpandedState[field.id] = true
      }
    })
    setExpandedSections(initialExpandedState)
  }, [])

  // Handle form submission
  const onSubmit = useCallback(
    (data: FormBuilderValues) => {
      if (fields.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one section to your form",
          variant: "destructive",
        })
        return
      }

      // Check if there are any top-level fields that are not sections
      const hasNonSectionTopLevelFields = fields.some(field => !field.parentId && field.type !== "section");
      if (hasNonSectionTopLevelFields) {
        toast({
          title: "Error",
          description: "All top-level fields must be sections",
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
      
      // Show success toast
      toast({
        title: "Form saved",
        description: "Your form has been saved successfully",
      })

      onSave(formData)
    },
    [fields, onSave, toast, formId],
  )

  // Toggle section expansion
  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }, [])

  // Add a new field
  const addField = useCallback(
    (type: string, parentId: string | null = null) => {
      // If trying to add a non-section field at the top level, show a toast message
      if (!parentId && type !== "section") {
        toast({
          title: "Invalid Operation",
          description: "Please add a section first before adding other field types.",
          variant: "destructive",
        });
        return;
      }

      const newField: FormFieldType = {
        id: `field_${nextFieldId}`,
        type,
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
        required: type !== "section", // Only set required for non-section fields
        parentId,
        options:
          type === "dropdown" || type === "multiselect" || type === "radio" || type === "checkbox"
            ? []
            : undefined,
        children: type === "section" ? [] : undefined,
        isExpanded: type === "section" ? true : undefined,
      }

      setNextFieldId((prevId) => prevId + 1)

      // If this is a section, initialize it as expanded
      if (type === "section") {
        setExpandedSections((prev) => ({
          ...prev,
          [newField.id]: true,
        }))
      }

      // If adding to a section, update the section's children array
      if (parentId) {
        setFields((prevFields) => {
          // Create a new array to avoid mutating the state directly
          const updatedFields = [...prevFields]
          const parentIndex = updatedFields.findIndex((f) => f.id === parentId)

          if (parentIndex !== -1) {
            // Create a new parent field object with updated children
            const parentField = {
              ...updatedFields[parentIndex],
              children: [...(updatedFields[parentIndex].children || []), newField.id]
            }
            // Replace the parent field in the array
            updatedFields[parentIndex] = parentField
          }

          // Add the new field to the array
          return [...updatedFields, newField]
        })
      } else {
        // If not adding to a section, just add the new field
        setFields((prevFields) => [...prevFields, newField])
      }

      setSelectedFieldId(newField.id)
      setActiveTab("properties") // Switch to properties tab when adding a new field
    },
    [nextFieldId, toast],
  )

  // Update a field
  const updateField = useCallback((id: string, updates: Partial<FormFieldType>) => {
    setFields((prevFields) => prevFields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }, [])

  // Duplicate a field
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

      // If duplicating a section, initialize it as expanded
      if (fieldToDuplicate.type === "section") {
        setExpandedSections((prev) => ({
          ...prev,
          [newField.id]: true,
        }))
      }

      // If the field has a parent, update the parent's children array
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

  // Delete a field
  const deleteField = useCallback(
    (id: string) => {
      // Get the field to delete
      const fieldToDelete = fields.find((field) => field.id === id)
      if (!fieldToDelete) return

      // If it's a section, also delete all its children
      const idsToDelete = new Set<string>([id])

      if (fieldToDelete.type === "section" && fieldToDelete.children) {
        fieldToDelete.children.forEach((childId) => {
          idsToDelete.add(childId)

          // Also delete any nested children (if the child is a section)
          const childField = fields.find((f) => f.id === childId)
          if (childField?.type === "section" && childField.children) {
            childField.children.forEach((nestedChildId) => idsToDelete.add(nestedChildId))
          }
        })
      }

      // If the field has a parent, update the parent's children array
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

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const sourceIndex = result.source.index
      const destinationIndex = result.destination.index
      const sourceDroppableId = result.source.droppableId
      const destinationDroppableId = result.destination.droppableId

      // If moving within the same list
      if (sourceDroppableId === destinationDroppableId) {
        if (sourceDroppableId === "form-fields") {
          // Moving within the main form fields
          const reorderedFields = Array.from(fields.filter((f) => !f.parentId))
          const [movedItem] = reorderedFields.splice(sourceIndex, 1)
          reorderedFields.splice(destinationIndex, 0, movedItem)

          // Update the fields array while preserving fields with parents
          setFields((prevFields) => {
            const fieldsWithParents = prevFields.filter((f) => f.parentId)
            return [...reorderedFields, ...fieldsWithParents]
          })
        } else {
          // Moving within a section
          const sectionId = sourceDroppableId.replace("section-", "")
          const sectionFields = fields.filter((f) => f.parentId === sectionId)
          const reorderedSectionFields = Array.from(sectionFields)
          const [movedItem] = reorderedSectionFields.splice(sourceIndex, 1)
          reorderedSectionFields.splice(destinationIndex, 0, movedItem)

          // Update the section's children array
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
        // Moving between different lists
        const sourceParentId = sourceDroppableId === "form-fields" ? null : sourceDroppableId.replace("section-", "")
        const destParentId =
          destinationDroppableId === "form-fields" ? null : destinationDroppableId.replace("section-", "")

        // Get the relevant fields for source and destination
        const sourceFields = sourceParentId
          ? fields.filter((f) => f.parentId === sourceParentId)
          : fields.filter((f) => !f.parentId)

        const destFields = destParentId
          ? fields.filter((f) => f.parentId === destParentId)
          : fields.filter((f) => !f.parentId)

        // Get the field being moved
        const fieldToMove = sourceFields[sourceIndex]

        // Update the field's parent
        setFields((prevFields) => {
          return prevFields.map((field) => {
            if (field.id === fieldToMove.id) {
              return { ...field, parentId: destParentId }
            }
            return field
          })
        })

        // Update the children arrays of both source and destination parents
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

  // Handle custom category input
  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value)
    form.setValue("category", value)
  }

  // Get the selected field
  const selectedField = selectedFieldId ? fields.find((field) => field.id === selectedFieldId) : null

  // Handle form submission prevention
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Only prevent default if the target is a textarea with class containing "options-input"
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
    // Check if the field is nested within a section
    const isNestedField = parentId !== null

    // Common field content that's shared between draggable and non-draggable fields
    const fieldContent = (
      <div
        className={cn(
          "mb-4 border rounded-md shadow-sm",
          selectedFieldId === field.id ? "ring-2 ring-primary" : "border-gray-200",
        )}
      >
        <div className="flex items-center bg-white border-b rounded-t-md p-2">
          {/* Only show drag handle for top-level fields */}
          {!isNestedField && (
            <div className="cursor-move mr-2">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}

          {/* Section expansion controls */}
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

          {/* Field label and controls */}
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

        <FieldPreview field={field} isSelected={selectedFieldId === field.id} />

        {/* Render section children if expanded - Note: Children are static and cannot be reordered */}
        {isSection && isExpanded && field.children && field.children.length > 0 && (
          <div className="ml-6 pl-2 border-l-2 border-gray-200 mt-2">
            <div className="space-y-2">
              {field.children?.map((childId, childIndex) => {
                const childField = fields.find((f) => f.id === childId)
                if (!childField) return null
                return renderField(childField, childIndex, field.id)
              })}
            </div>

            {/* Add field to section button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 w-full text-sm"
              onClick={() => {
                // Set the containing section as the selected field
                setSelectedFieldId(field.id)
                setActiveTab("fields")
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Field to Section
            </Button>
          </div>
        )}
      </div>
    )

    // Conditional rendering based on field nesting:
    // - Nested fields (within sections) are rendered without drag and drop functionality
    // - Top-level fields are wrapped with Draggable for reordering
    if (isNestedField) {
      return fieldContent
    }

    return (
      <Draggable key={field.id} draggableId={field.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {fieldContent}
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
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Left Card - Form Details (60%) */}
              <div className="lg:col-span-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h3 className="text-xl font-bold">Form Details</h3>

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

                    <div className="space-y-4">
                      <h4 className="font-medium">Form Fields</h4>

                      <div className="min-h-[300px] border-2 border-dashed border-gray-200 rounded-md p-4 bg-gray-50">
                        {fields.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            Add a section to contain your form fields
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

              {/* Right Card - Form Controls (40%) */}
              <div className="lg:col-span-4">
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

                      <TabsContent value="fields" className="space-y-2 border p-3 rounded-md">
                        <div className="bg-muted p-2 rounded-md mb-2">
                          <p className="text-sm font-medium">
                            {selectedField && selectedField.type === "section"
                              ? `Add field to section: ${selectedField.label}`
                              : "Add a section to contain your form fields"}
                          </p>
                        </div>
                        {fieldTypes
                          .filter(type => {
                            // If we're adding to a section, show all field types except sections
                            if (selectedField?.type === "section") {
                              return type.id !== "section"
                            }
                            // If we're at the top level, only show section type
                            return type.id === "section"
                          })
                          .map((type) => (
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
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
                Cancel
              </Button>
              <div className="flex space-x-2">
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


