import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"

interface OptionsEditorProps {
  options: string[]
  onChange: (options: string[]) => void
  onFocus?: () => void
  onBlur?: () => void
}

export function OptionsEditor({ options, onChange, onFocus, onBlur }: OptionsEditorProps) {
  const [optionsText, setOptionsText] = useState(options.join("\n"))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update the options text when the options prop changes
  useEffect(() => {
    setOptionsText(options.join("\n"))
  }, [options])

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setOptionsText(newText)

    // Parse the text into options
    const newOptions = newText
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean)

    onChange(newOptions)
  }

  // Handle key down to prevent form submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // Prevent the event from bubbling up to parent elements
      e.stopPropagation()

      // Don't prevent default - we want the Enter key to create a new line
      // in the textarea as normal
    }
  }

  return (
    <Textarea
      ref={textareaRef}
      value={optionsText}
      onChange={handleTextChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className="min-h-[150px] bg-white whitespace-pre-wrap"
      placeholder="Enter one option per line"
      rows={6}
    />
  )
}
