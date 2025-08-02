import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedRichTextEditor } from "./enhanced-rich-text-editor"
import { RichTextDisplay } from "./rich-text-display"

export function RichTextDemo() {
  const [content, setContent] = useState(`<h1>Welcome to Rich Text Editor Demo</h1>
<p>This is a <strong>bold text</strong> and this is <em>italic text</em>.</p>
<h2>Features Available:</h2>
<ul>
  <li><strong>Bold text</strong></li>
  <li><em>Italic text</em></li>
  <li><a href="https://example.com" target="_blank">Links</a></li>
  <li>Bullet lists</li>
  <li>Numbered lists</li>
  <li>Text alignment</li>
  <li>Headings (H1, H2)</li>
  <li>Blockquotes</li>
</ul>
<blockquote>
  <p>This is a blockquote example for important information.</p>
</blockquote>
<div style="text-align: center;">
  <p>This text is center-aligned</p>
</div>
<div style="text-align: right;">
  <p>This text is right-aligned</p>
</div>`)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rich Text Editor Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedRichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start typing your rich content here..."
            minHeight="300px"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rich Text Display Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextDisplay 
            content={content} 
            className="border rounded-lg p-4 bg-gray-50"
            placeholder="No content to display"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HTML Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            {content}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
} 