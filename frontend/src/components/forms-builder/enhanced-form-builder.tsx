import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, GripVertical, Settings, Trash2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { OptionsEditor } from "./options-editor"

// Define the form schema
const formBuilderSchema = z.object({
  title: z.string().min(2, {
    message: "Form title is required and must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Form description is required and must be at least 10 characters.",
  }),
  associatedEvent: z.string().optional(),
})

type FormBuilderValues = z.infer<typeof formBuilderSchema>

// Define field types
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

// Define field interface
interface FormFieldType {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
}

interface EnhancedFormBuilderProps {
  onClose: () => void
  onSave: (data: any) => void
  formId?: string | null
  defaultValues?: Partial<FormBuilderValues>
  defaultFields?: FormFieldType[]
}

export default function EnhancedFormBuilder({
  onClose,
  onSave,
  formId,
  defaultValues,
  defaultFields = [],
}: EnhancedFormBuilderProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("fields")
  const [fields, setFields] = useState<FormFieldType[]>(defaultFields)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [nextFieldId, setNextFieldId] = useState(defaultFields.length + 1)

  // Create a ref to track if we're currently editing options
  const isEditingOptionsRef = useRef(false)

  // Initialize the form
  const form = useForm<FormBuilderValues>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      associatedEvent: "",
    },
  })

  // Handle form submission
  const onSubmit = useCallback(
    (data: FormBuilderValues) => {
      // Don't submit if we're editing options
      if (isEditingOptionsRef.current) {
        return
      }

      if (fields.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one field to your form",
          variant: "destructive",
        })
        return
      }

      onSave({
        ...data,
        fields,
      })
    },
    [fields, onSave, toast],
  )

  // Add a new field
  const addField = useCallback(
    (type: string) => {
      const newField: FormFieldType = {
        id: `field_${nextFieldId}`,
        type,
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
        required: false,
        options:
          type === "dropdown" || type === "multiselect" || type === "radio" || type === "checkbox"
            ? ["Option 1", "Option 2", "Option 3"]
            : undefined,
      }

      setNextFieldId((prevId) => prevId + 1)
      setFields((prevFields) => [...prevFields, newField])
      setSelectedFieldId(newField.id)
      setEditingFieldId(newField.id)
    },
    [nextFieldId],
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
      }

      setNextFieldId((prevId) => prevId + 1)
      setFields((prevFields) => [...prevFields, newField])
      setSelectedFieldId(newField.id)
      setEditingFieldId(newField.id)
    },
    [fields, nextFieldId],
  )

  // Delete a field
  const deleteField = useCallback(
    (id: string) => {
      setFields((prevFields) => prevFields.filter((field) => field.id !== id))
      if (selectedFieldId === id) {
        setSelectedFieldId(null)
        setEditingFieldId(null)
      }
    },
    [selectedFieldId],
  )

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const items = Array.from(fields)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      setFields(items)
    },
    [fields],
  )

  // Handle saving as template
  const handleSaveAsTemplate = useCallback((templateData: any) => {
    // In a real app, you would call an API to save the template
    console.log("Saving as template:", templateData)
  }, [])

  // Handle form key down to prevent submission on Enter in specific cases
  const handleFormKeyDown = useCallback((e: React.KeyboardEvent) => {
    // If we're editing options, prevent form submission on Enter
    if (isEditingOptionsRef.current && e.key === "Enter") {
      e.stopPropagation()
    }
  }, [])

  // Render a field in the form preview
  const renderField = useCallback(
    (field: FormFieldType) => {
      const isSelected = selectedFieldId === field.id

      switch (field.type) {
        case "text":
          return (
            <div className={cn("p-4 border rounded-md", isSelected && "border-yellow-400 bg-yellow-50")}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-gray-500 mb-2">{field.description}</p>}
              <Input placeholder={field.placeholder || "Text input"} disabled className="bg-white" />
            </div>
          )
        case "textarea":
          return (
            <div className={cn("p-4 border rounded-md", isSelected && "border-yellow-400 bg-yellow-50")}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-gray-500 mb-2">{field.description}</p>}
              <Textarea placeholder={field.placeholder || "Text area"} disabled className="bg-white" />
            </div>
          )
        case "email":
          return (
            <div className={cn("p-4 border rounded-md", isSelected && "border-yellow-400 bg-yellow-50")}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-gray-500 mb-2">{field.description}</p>}
              <Input type="email" placeholder={field.placeholder || "Email address"} disabled className="bg-white" />
            </div>
          )
        case "number":
          return (
            <div className={cn("p-4 border rounded-md", isSelected && "border-yellow-400 bg-yellow-50")}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-gray-500 mb-2">{field.description}</p>}
              <Input type="number" placeholder={field.placeholder || "Number"} disabled className="bg-white" />
            </div>
          )
        case "dropdown":
          return (
            <div className={cn("p-4 border rounded-md", isSelected && "border-yellow-400 bg-yellow-50")}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-gray-500 mb-2">{field.description}</p>}
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option, index) => (
                    <SelectItem key={index} value={option || `option-${index}`}>
                      <div className="whitespace-pre-wrap">{option}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        case "section":
          return (
            <div className={cn("p-4 border rounded-md", isSelected && "border-yellow-400 bg-yellow-50")}>
              <h3 className="font-medium text-lg">{field.label}</h3>
              {field.description && <p className="text-sm text-gray-500">{field.description}</p>}
            </div>
          )
        default:
          return (
            <div className={cn("p-4 border rounded-md", isSelected && "border-yellow-400 bg-yellow-50")}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-gray-500 mb-2">{field.description}</p>}
              <div className="text-sm text-gray-500 italic">
                {field.type.charAt(0).toUpperCase() + field.type.slice(1)} field
              </div>
            </div>
          )
      }
    },
    [selectedFieldId],
  )

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 w-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Create New Form</h2>
          <p className="text-gray-500">Drag and drop form elements to build your form.</p>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit(onSubmit)(e)
            }}
            onKeyDown={handleFormKeyDown}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h3 className="text-xl font-bold">Form Design</h3>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Form Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter form title" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Form Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter form description" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="associatedEvent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Associated Event</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select an event (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="event1">Career Workshop for Ethnic Minorities</SelectItem>
                              <SelectItem value="event2">Cultural Exchange Festival</SelectItem>
                              <SelectItem value="event3">Language Learning Program</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Linking a form to an event will make it the registration form for that event
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h4 className="font-medium">Form Fields</h4>

                      <div className="min-h-[300px] border border-dashed rounded-md p-4 bg-gray-50">
                        {fields.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            Add form fields from the panel on the right
                          </div>
                        ) : (
                          <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="form-fields">
                              {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                  {fields.map((field, index) => (
                                    <Draggable key={field.id} draggableId={field.id} index={index}>
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={cn(
                                            "mb-4",
                                            selectedFieldId === field.id && "ring-2 ring-yellow-400",
                                          )}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setSelectedFieldId(field.id)
                                          }}
                                        >
                                          <div className="flex items-center bg-white border rounded-t-md p-2">
                                            <div {...provided.dragHandleProps} className="cursor-move mr-2">
                                              <GripVertical className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <span className="text-sm font-medium flex-1">
                                              {field.type}: {field.label}
                                            </span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                e.preventDefault()
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
                                                e.preventDefault()
                                                setEditingFieldId(editingFieldId === field.id ? null : field.id)
                                              }}
                                            >
                                              <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                                deleteField(field.id)
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </div>
                                          {renderField(field)}

                                          {editingFieldId === field.id && (
                                            <div className="border border-t-0 rounded-b-md p-4 bg-gray-50 space-y-4">
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium">Field Label</label>
                                                <Input
                                                  value={field.label}
                                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                  className="bg-white"
                                                />
                                              </div>

                                              {field.type !== "section" && (
                                                <div className="space-y-2">
                                                  <label className="text-sm font-medium">Placeholder</label>
                                                  <Input
                                                    value={field.placeholder || ""}
                                                    onChange={(e) =>
                                                      updateField(field.id, { placeholder: e.target.value })
                                                    }
                                                    className="bg-white"
                                                  />
                                                </div>
                                              )}

                                              <div className="space-y-2">
                                                <label className="text-sm font-medium">Description</label>
                                                <Input
                                                  value={field.description || ""}
                                                  onChange={(e) =>
                                                    updateField(field.id, { description: e.target.value })
                                                  }
                                                  className="bg-white"
                                                />
                                              </div>

                                              {(field.type === "dropdown" ||
                                                field.type === "multiselect" ||
                                                field.type === "radio" ||
                                                field.type === "checkbox") && (
                                                <div className="space-y-2">
                                                  <label className="text-sm font-medium">Options (one per line)</label>
                                                  <OptionsEditor
                                                    options={field.options || []}
                                                    onChange={(newOptions) => {
                                                      updateField(field.id, { options: newOptions })
                                                    }}
                                                    onFocus={() => {
                                                      isEditingOptionsRef.current = true
                                                    }}
                                                    onBlur={() => {
                                                      isEditingOptionsRef.current = false
                                                    }}
                                                  />
                                                </div>
                                              )}

                                              {field.type !== "section" && (
                                                <div className="flex items-center space-x-2">
                                                  <input
                                                    type="checkbox"
                                                    id={`required-${field.id}`}
                                                    checked={field.required}
                                                    onChange={(e) => {
                                                      updateField(field.id, { required: e.target.checked })
                                                    }}
                                                    className="rounded border-gray-300"
                                                  />
                                                  <label
                                                    htmlFor={`required-${field.id}`}
                                                    className="text-sm cursor-pointer"
                                                  >
                                                    Required field
                                                  </label>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
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

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Form Controls</h3>

                    <Tabs defaultValue="fields" value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="fields">Fields</TabsTrigger>
                        <TabsTrigger value="properties">Properties</TabsTrigger>
                      </TabsList>

                      <TabsContent value="fields" className="space-y-2">
                        {fieldTypes.map((type) => (
                          <Button
                            key={type.id}
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left h-10 mb-2"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              addField(type.id)
                            }}
                          >
                            {type.icon}
                            <span className="ml-2">{type.label}</span>
                          </Button>
                        ))}
                      </TabsContent>

                      <TabsContent value="properties">
                        {selectedFieldId ? (
                          <div className="space-y-4">
                            {fields.find((f) => f.id === selectedFieldId) ? (
                              <>
                                <h4 className="font-medium">Edit Field Properties</h4>
                                <p className="text-sm text-gray-500">Configure the selected field's properties</p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-500">Select a field to edit its properties</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Select a field to edit its properties</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="h-12 px-6">
                Cancel
              </Button>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-black hover:bg-black/80 text-white h-12 px-6">
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
