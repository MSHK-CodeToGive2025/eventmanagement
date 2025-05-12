import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { FormField } from "@/types/form-types"

interface DynamicFormFieldProps {
  field: FormField
  value: any
  onChange: (fieldId: string, value: any) => void
  error?: string
}

export function DynamicFormField({ field, value, onChange, error }: DynamicFormFieldProps) {
  const handleChange = (newValue: any) => {
    onChange(field._id, newValue)
  }

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            id={field._id}
            type={field.type}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        )

      case "textarea":
        return (
          <Textarea
            id={field._id}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        )

      case "dropdown":
        return (
          <Select value={value || ""} onValueChange={handleChange}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder="Select an option" />
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

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field._id}
              checked={value || false}
              onCheckedChange={handleChange}
              className={error ? "border-red-500" : ""}
            />
            <label
              htmlFor={field._id}
              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                error ? "text-red-500" : ""
              }`}
            >
              {field.label}
            </label>
          </div>
        )

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  error && "border-red-500",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={handleChange} />
            </PopoverContent>
          </Popover>
        )

      default:
        return <div>Unsupported field type: {field.type}</div>
    }
  }

  // For checkbox type, we render the field differently
  if (field.type === "checkbox") {
    return (
      <div className="space-y-2">
        {renderField()}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {field.helpText && <p className="text-gray-500 text-sm">{field.helpText}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field._id} className="flex items-center">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {field.helpText && <p className="text-gray-500 text-sm">{field.helpText}</p>}
    </div>
  )
}
