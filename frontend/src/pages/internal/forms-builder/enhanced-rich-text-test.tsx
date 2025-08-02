import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedRichTextEditor } from "@/components/ui/enhanced-rich-text-editor"
import { RichTextDisplay } from "@/components/ui/rich-text-display"

export default function EnhancedRichTextTest() {
  const [content, setContent] = useState(`<h1>Enhanced Rich Text Editor Test</h1>
<p>This is a test of the new <strong>enhanced rich text editor</strong> with proper support for:</p>
<ul>
  <li><strong>Bold text</strong> (Ctrl+B)</li>
  <li><em>Italic text</em> (Ctrl+I)</li>
  <li>Bullet lists (click the list button)</li>
  <li>Numbered lists (click the numbered list button)</li>
  <li>Text alignment (left, center, right)</li>
  <li><strong>Undo/Redo</strong> (Ctrl+Z, Ctrl+Y)</li>
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Enhanced Rich Text Editor Test</h1>
        <p className="text-gray-600">Testing the new editor with proper undo/redo and list support</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Rich Text Editor</CardTitle>
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
          <CardTitle>Rich Text Display</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Features Tested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-semibold">Basic Formatting:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Bold text (Ctrl+B or toolbar button)</li>
              <li>Italic text (Ctrl+I or toolbar button)</li>
              <li>Bullet lists (toolbar button)</li>
              <li>Numbered lists (toolbar button)</li>
              <li>Text alignment (left, center, right)</li>
            </ul>
            
            <h3 className="font-semibold mt-4">Advanced Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Undo (Ctrl+Z or toolbar button)</li>
              <li>Redo (Ctrl+Y or toolbar button)</li>
              <li>Clean paste (strips formatting)</li>
              <li>Keyboard shortcuts</li>
              <li>Real-time preview</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 