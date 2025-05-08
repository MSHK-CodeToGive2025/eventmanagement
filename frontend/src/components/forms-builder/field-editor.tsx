import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { FormFieldType } from "./simplified-form-builder"
import { OptionsInput } from "./options-input"

interface FieldEditorProps {
  field: FormFieldType
  onUpdate: (id: string, updates: Partial<FormFieldType>) => void
}

export function FieldEditor({ field, onUpdate }: FieldEditorProps) {
  const [label, setLabel] = useState(field.label)
  const [placeholder, setPlaceholder] = useState(field.placeholder || "")
  const [description, setDescription] = useState(field.description || "")
  const [required, setRequired] = useState(field.required)

  const handleLabelChange = (value: string) => {
    setLabel(value)
    onUpdate(field.id, { label: value })
  }

  const handlePlaceholderChange = (value: string) => {
    setPlaceholder(value)
    onUpdate(field.id, { placeholder: value })
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    onUpdate(field.id, { description: value })
  }

  const handleRequiredChange = (checked: boolean) => {
    setRequired(checked)
    onUpdate(field.id, { required: checked })
  }

  const handleOptionsChange = (options: string[]) => {
    onUpdate(field.id, { options })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="field-label">Field Label</Label>
        <Input id="field-label" value={label} onChange={(e) => handleLabelChange(e.target.value)} className="mt-1" />
      </div>

      <div>
        <Label htmlFor="field-placeholder">Placeholder</Label>
        <Input
          id="field-placeholder"
          value={placeholder}
          onChange={(e) => handlePlaceholderChange(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="field-description">Description</Label>
        <Textarea
          id="field-description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="field-required" checked={required} onCheckedChange={handleRequiredChange} />
        <Label htmlFor="field-required">Required Field</Label>
      </div>

      {(field.type === "dropdown" ||
        field.type === "multiselect" ||
        field.type === "radio" ||
        field.type === "checkbox") && (
        <div>
          <Label>Options</Label>
          <div className="mt-1">
            <OptionsInput options={field.options || []} onChange={handleOptionsChange} />
          </div>
        </div>
      )}
    </div>
  )
}
