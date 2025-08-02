import { useState, useEffect } from "react"
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link, Heading1, Heading2, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ value, onChange, placeholder = "", minHeight = "200px" }: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("edit")
  const [htmlValue, setHtmlValue] = useState<string>(value || "")

  // Sync htmlValue with value prop
  useEffect(() => {
    setHtmlValue(value || "")
  }, [value])

  const handleChange = (newValue: string) => {
    setHtmlValue(newValue)
    onChange(newValue)
  }

  const insertTag = (tag: string, attributes = "") => {
    const textarea = document.getElementById("rich-text-editor") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const beforeText = textarea.value.substring(0, start)
    const afterText = textarea.value.substring(end)

    const openTag = attributes ? `<${tag} ${attributes}>` : `<${tag}>`
    const closeTag = `</${tag}>`

    const newValue = `${beforeText}${openTag}${selectedText}${closeTag}${afterText}`
    handleChange(newValue)

    // Set focus back to textarea and position cursor after the inserted tag + content
    setTimeout(() => {
      textarea.focus()
      const newCursorPosition = start + openTag.length + selectedText.length + closeTag.length
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  const insertList = (ordered: boolean) => {
    const textarea = document.getElementById("rich-text-editor") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const beforeText = textarea.value.substring(0, start)
    const afterText = textarea.value.substring(start)

    const listTag = ordered ? "ol" : "ul"
    const listItem = "<li>List item</li>"
    const newValue = `${beforeText}<${listTag}>${listItem}</${listTag}>${afterText}`

    handleChange(newValue)
  }

  const insertHeading = (level: number) => {
    const textarea = document.getElementById("rich-text-editor") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const beforeText = textarea.value.substring(0, start)
    const afterText = textarea.value.substring(start)

    const headingTag = `h${level}`
    const headingText = `Heading ${level}`
    const newValue = `${beforeText}<${headingTag}>${headingText}</${headingTag}>${afterText}`

    handleChange(newValue)
  }

  return (
    <div className="border rounded-md">
      <div className="bg-gray-50 p-2 border-b flex flex-wrap gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => insertTag("strong")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertTag("em")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(1)} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(2)} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertTag("blockquote")} title="Quote">
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertList(false)} title="Bullet List">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => insertList(true)} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag("div", 'style="text-align: left;"')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag("div", 'style="text-align: center;"')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertTag("div", 'style="text-align: right;"')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt("Enter URL:", "https://")
            if (url) {
              insertTag("a", `href="${url}" target="_blank"`)
            }
          }}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="p-0">
          <Textarea
            id="rich-text-editor"
            value={htmlValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ minHeight }}
          />
        </TabsContent>

        <TabsContent value="preview" className="p-4 prose max-w-none">
          {htmlValue ? (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlValue }} 
            />
          ) : (
            <p className="text-gray-400">{placeholder || "No content to preview"}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
