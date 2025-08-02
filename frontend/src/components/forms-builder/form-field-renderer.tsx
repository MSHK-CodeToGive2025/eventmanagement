
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RichTextDisplay } from "@/components/ui/rich-text-display"

export interface FormFieldData {
  _id: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
  validation?: {
    minValue?: number
    maxValue?: number
  }
}

interface FormFieldRendererProps {
  field: FormFieldData
  value: any
  onChange: (fieldId: string, value: any) => void
  error?: string
  disabled?: boolean
  disableValidation?: boolean
}

export function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
  disableValidation = false,
}: FormFieldRendererProps) {
  const handleChange = (newValue: any) => {
    if (!disabled) {
      onChange(field._id, newValue)
    }
  }

  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={field._id}
            type="text"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            required={!disableValidation && field.required}
            disabled={disabled}
          />
        )

      case "email":
        return (
          <Input
            id={field._id}
            type="email"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            required={!disableValidation && field.required}
            disabled={disabled}
          />
        )

      case "phone":
        return (
          <Input
            id={field._id}
            type="tel"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            required={!disableValidation && field.required}
            disabled={disabled}
          />
        )

      case "number":
        return (
          <Input
            id={field._id}
            type="number"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            required={!disableValidation && field.required}
            disabled={disabled}
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
          />
        )

      case "textarea":
        return (
          <Textarea
            id={field._id}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            required={!disableValidation && field.required}
            disabled={disabled}
            rows={4}
          />
        )

      case "dropdown":
        return (
          <Select
            value={value || ""}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup
            value={value || ""}
            onValueChange={handleChange}
            disabled={disabled}
          >
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field._id}-${option}`} />
                <Label htmlFor={`${field._id}-${option}`} className="text-sm font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field._id}-${option}`}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (checked) {
                      handleChange([...currentValues, option])
                    } else {
                      handleChange(currentValues.filter(v => v !== option))
                    }
                  }}
                  disabled={disabled}
                />
                <Label htmlFor={`${field._id}-${option}`} className="text-sm font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      default:
        return (
          <Input
            id={field._id}
            type="text"
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            required={!disableValidation && field.required}
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field._id}>
        {field.label}
        {!disableValidation && field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.helpText && (
        <RichTextDisplay 
          content={field.helpText} 
          className="text-sm text-gray-500"
        />
      )}
      {renderField()}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 