import React from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import { cn } from "@/lib/utils"

interface ReactQuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

export function ReactQuillEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = "200px",
  className
}: ReactQuillEditorProps) {
  // Quill modules to attach to editor
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }

  // Quill editor formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ]

  return (
    <div className={cn("border rounded-md", className)}>
      <style>
        {`
          .quill-editor .ql-editor {
            min-height: ${minHeight};
            font-size: 14px;
            line-height: 1.6;
          }
          .quill-editor .ql-toolbar {
            border-top: none;
            border-left: none;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
            background-color: #f9fafb;
          }
          .quill-editor .ql-container {
            border: none;
          }
          .quill-editor .ql-editor.ql-blank::before {
            color: #9ca3af;
            font-style: italic;
          }
        `}
      </style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="quill-editor"
      />
    </div>
  )
} 