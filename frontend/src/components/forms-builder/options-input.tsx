/**
 * OptionsInput Component
 * 
 * A reusable component for managing a list of options (e.g., for dropdown, radio, or checkbox fields).
 * Features:
 * - Add new options via input field
 * - Remove existing options
 * - Read-only display of existing options
 */

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

/**
 * Props interface for the OptionsInput component
 * @property {string[]} options - Array of existing options
 * @property {function} onChange - Callback function when options are modified
 */
interface OptionsInputProps {
  options: string[]
  onChange: (options: string[]) => void
}

/**
 * OptionsInput Component
 * 
 * Renders a list of options with the ability to add and remove options.
 * Each option is displayed in a read-only input field with a remove button.
 * New options can be added through an input field at the bottom.
 * 
 * @param {OptionsInputProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export function OptionsInput({ options, onChange }: OptionsInputProps) {
  // State for managing the new option input field
  const [newOption, setNewOption] = useState("")

  /**
   * Handles adding a new option to the list
   * - Trims whitespace from the new option
   * - Only adds non-empty options
   * - Clears the input field after adding
   */
  const handleAddOption = () => {
    if (newOption.trim()) {
      onChange([...options, newOption.trim()])
      setNewOption("")
    }
  }

  /**
   * Handles removing an option from the list
   * @param {number} index - Index of the option to remove
   */
  const handleRemoveOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {/* Display existing options */}
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input value={option} readOnly />
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => handleRemoveOption(index)}
            data-testid={`remove-option-${index}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Input field for adding new options */}
      <div className="flex items-center gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Add new option"
          data-testid="new-option-input"
        />
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={handleAddOption}
          data-testid="add-option-button"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
