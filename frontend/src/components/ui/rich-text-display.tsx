import React from "react"
import { cn } from "@/lib/utils"

interface RichTextDisplayProps {
  content: string
  className?: string
  placeholder?: string
}

export function RichTextDisplay({ content, className, placeholder = "No content available" }: RichTextDisplayProps) {
  if (!content || content.trim() === "") {
    return (
      <div className={cn("text-gray-400 italic", className)}>
        {placeholder}
      </div>
    )
  }

  return (
    <div 
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  )
} 