import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactQuillEditor } from "./react-quill-editor"
import { RichTextDisplay } from "./rich-text-display"

export default function RichTextDemo() {
  const [content, setContent] = useState(`<h1>Rich Text Editor Demo</h1>
<p>This is a demonstration of the <strong>rich text editor</strong> capabilities:</p>
<ul>
  <li><strong>Bold text</strong></li>
  <li><em>Italic text</em></li>
  <li>Bullet lists</li>
  <li>Numbered lists</li>
  <li>Text alignment</li>
  <li>Headers (H1, H2, H3)</li>
  <li>Colors and backgrounds</li>
  <li>Links and images</li>
</ul>
<ol>
  <li>First numbered item</li>
  <li>Second numbered item</li>
  <li>Third numbered item</li>
</ol>
<p style="text-align: center;">This text is center-aligned</p>
<p style="text-align: right;">This text is right-aligned</p>
<blockquote>
  <p>This is a blockquote example for important information.</p>
</blockquote>`)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Rich Text Editor Demo</h1>
        <p className="text-gray-600">Test the React-Quill rich text editor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>React-Quill Editor</CardTitle>
            <p className="text-sm text-gray-600">Edit content and see live preview</p>
          </CardHeader>
          <CardContent>
            <ReactQuillEditor
              value={content}
              onChange={setContent}
              placeholder="Start typing your rich content here..."
              minHeight="300px"
            />
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardHeader>
            <CardTitle>Rendered Output</CardTitle>
            <p className="text-sm text-gray-600">How the content looks when displayed</p>
          </CardHeader>
          <CardContent>
            <RichTextDisplay content={content} />
          </CardContent>
        </Card>
      </div>

      {/* HTML Output */}
      <Card>
        <CardHeader>
          <CardTitle>HTML Output</CardTitle>
          <p className="text-sm text-gray-600">The HTML that gets saved to the database</p>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
            <pre>{content}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 