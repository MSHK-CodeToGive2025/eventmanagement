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
      className={cn(
        "prose prose-sm max-w-none",
        // Enhanced styling for lists and other elements
        "prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4",
        "prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4", 
        "prose-li:my-1",
        "prose-headings:font-semibold prose-headings:text-gray-900",
        "prose-p:text-gray-700 prose-p:leading-relaxed",
        "prose-strong:font-semibold prose-strong:text-gray-900",
        "prose-em:italic prose-em:text-gray-700",
        "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600",
        "prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  )
} 