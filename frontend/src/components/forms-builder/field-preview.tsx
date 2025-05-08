import type { FormFieldType } from "./simplified-form-builder"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FieldPreviewProps {
  field: FormFieldType
  isSelected: boolean
}

export function FieldPreview({ field, isSelected }: FieldPreviewProps) {
  const { type, label, placeholder, required, options, description } = field

  // Render the appropriate field type
  const renderField = () => {
    switch (type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            type={type}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            disabled
            className="bg-gray-50"
          />
        )
      case "textarea":
        return (
          <Textarea
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            disabled
            className="bg-gray-50 min-h-[100px]"
          />
        )
      case "dropdown":
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder={placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "multiselect":
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder={placeholder || "Select options"} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "checkbox":
        return (
          <div className="space-y-2">
            {options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox id={`${field.id}-${index}`} disabled />
                <Label htmlFor={`${field.id}-${index}`} className="text-sm text-gray-500">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )
      case "radio":
        return (
          <RadioGroup disabled>
            {options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} disabled />
                <Label htmlFor={`${field.id}-${index}`} className="text-sm text-gray-500">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      case "date":
        return <Input type="date" disabled className="bg-gray-50" />
      case "file":
        return <Input type="file" disabled className="bg-gray-50" />
      case "section":
        return (
          <div className="border-l-4 border-gray-300 pl-4 py-1">
            <p className="text-sm text-gray-500">Section divider</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("p-4 bg-white border-x border-b rounded-b-md", isSelected && "ring-2 ring-yellow-400")}>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>

        {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}

        {renderField()}
      </div>
    </div>
  )
}
