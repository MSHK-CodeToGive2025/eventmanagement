import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedRichTextEditor } from "@/components/ui/enhanced-rich-text-editor"
import { ReactQuillEditor } from "@/components/ui/react-quill-editor"
import { RichTextDisplay } from "@/components/ui/rich-text-display"

export default function RichTextComparison() {
  const [enhancedContent, setEnhancedContent] = useState(`<h1>Enhanced Rich Text Editor Test</h1>
<p>This is a test of the <strong>enhanced rich text editor</strong> with:</p>
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

  const [quillContent, setQuillContent] = useState(`<h1>React-Quill Editor Test</h1>
<p>This is a test of the <strong>React-Quill editor</strong> with:</p>
<ul>
  <li><strong>Bold text</strong></li>
  <li><em>Italic text</em></li>
  <li>Bullet lists</li>
  <li>Numbered lists</li>
  <li>Text alignment</li>
  <li>Color options</li>
  <li>Link insertion</li>
</ul>
<blockquote>
  <p>This is a blockquote example for important information.</p>
</blockquote>
<p style="text-align: center;">This text is center-aligned</p>
<p style="text-align: right;">This text is right-aligned</p>`)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Rich Text Editor Comparison</h1>
        <p className="text-gray-600">Compare the enhanced editor vs React-Quill</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Rich Text Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Rich Text Editor (contentEditable)</CardTitle>
            <p className="text-sm text-gray-600">
              Uses contentEditable with document.execCommand()
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <EnhancedRichTextEditor
              value={enhancedContent}
              onChange={setEnhancedContent}
              placeholder="Start typing your rich content here..."
              minHeight="300px"
            />
            
            <div>
              <h3 className="font-semibold mb-2">Rendered Output:</h3>
              <RichTextDisplay content={enhancedContent} />
            </div>
          </CardContent>
        </Card>

        {/* React-Quill Editor */}
        <Card>
          <CardHeader>
            <CardTitle>React-Quill Editor</CardTitle>
            <p className="text-sm text-gray-600">
              Uses Quill.js - battle-tested rich text editor
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReactQuillEditor
              value={quillContent}
              onChange={setQuillContent}
              placeholder="Start typing your rich content here..."
              minHeight="300px"
            />
            
            <div>
              <h3 className="font-semibold mb-2">Rendered Output:</h3>
              <RichTextDisplay content={quillContent} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Enhanced Editor (contentEditable)</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Bold, Italic</li>
                <li>❌ Lists (unreliable)</li>
                <li>✅ Text Alignment</li>
                <li>✅ Undo/Redo</li>
                <li>❌ Limited features</li>
                <li>❌ Deprecated execCommand</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">React-Quill</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Bold, Italic, Underline, Strike</li>
                <li>✅ Bullet & Numbered Lists</li>
                <li>✅ Text Alignment</li>
                <li>✅ Headers (H1, H2, H3)</li>
                <li>✅ Colors & Background</li>
                <li>✅ Links & Images</li>
                <li>✅ Modern & Reliable</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 