import React, { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Undo, Redo, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

export function EnhancedRichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = "200px",
  className
}: EnhancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  // Update undo/redo state
  const updateUndoRedoState = useCallback(() => {
    if (editorRef.current) {
      setCanUndo(document.queryCommandEnabled("undo"))
      setCanRedo(document.queryCommandEnabled("redo"))
    }
  }, [])

  // Execute command and update content
  const executeCommand = useCallback((command: string, value?: string) => {
    if (editorRef.current) {
      // Ensure the editor is focused
      editorRef.current.focus()
      
      // For list commands, ensure we have a selection
      if (command === "insertUnorderedList" || command === "insertOrderedList") {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
          // If no selection, create a new line and select it
          const range = document.createRange()
          range.selectNodeContents(editorRef.current)
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }
      
      document.execCommand(command, false, value)
      updateUndoRedoState()
      
      // Update the value prop
      if (onChange) {
        onChange(editorRef.current.innerHTML)
      }
    }
  }, [onChange, updateUndoRedoState])

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  // Handle paste to clean HTML
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }, [])

  // Handle key shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault()
          executeCommand("bold")
          break
        case "i":
          e.preventDefault()
          executeCommand("italic")
          break
        case "z":
          e.preventDefault()
          if (e.shiftKey) {
            executeCommand("redo")
          } else {
            executeCommand("undo")
          }
          break
        case "y":
          e.preventDefault()
          executeCommand("redo")
          break
      }
    }
  }, [executeCommand])

  // Format buttons
  const formatButtons = [
    {
      icon: <Bold className="h-4 w-4" />,
      title: "Bold (Ctrl+B)",
      command: "bold",
      shortcut: "Ctrl+B"
    },
    {
      icon: <Italic className="h-4 w-4" />,
      title: "Italic (Ctrl+I)",
      command: "italic",
      shortcut: "Ctrl+I"
    },
    {
      icon: <List className="h-4 w-4" />,
      title: "Bullet List",
      command: "insertUnorderedList"
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      title: "Numbered List",
      command: "insertOrderedList"
    },
    {
      icon: <AlignLeft className="h-4 w-4" />,
      title: "Align Left",
      command: "justifyLeft"
    },
    {
      icon: <AlignCenter className="h-4 w-4" />,
      title: "Align Center",
      command: "justifyCenter"
    },
    {
      icon: <AlignRight className="h-4 w-4" />,
      title: "Align Right",
      command: "justifyRight"
    }
  ]

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Format buttons */}
        {formatButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand(button.command)}
            title={button.title}
            className="h-8 w-8 p-0"
          >
            {button.icon}
          </Button>
        ))}
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        {/* Undo/Redo buttons */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("undo")}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand("redo")}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* WYSIWYG Editor */}
      <div className="p-4">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className={cn(
            "outline-none min-h-[200px] prose prose-sm max-w-none",
            !value && "text-gray-400"
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
      </div>
    </div>
  )
} 