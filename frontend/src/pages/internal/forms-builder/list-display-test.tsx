import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactQuillEditor } from "@/components/ui/react-quill-editor"
import { RichTextDisplay } from "@/components/ui/rich-text-display"

export default function ListDisplayTest() {
  const [content, setContent] = useState(`<h1>List Display Test</h1>
<p>This page tests how lists are displayed in the RichTextDisplay component.</p>

<h2>Bullet Lists</h2>
<ul>
  <li>First bullet point</li>
  <li>Second bullet point with <strong>bold text</strong></li>
  <li>Third bullet point with <em>italic text</em></li>
  <li>Fourth bullet point with <a href="#">a link</a></li>
</ul>

<h2>Numbered Lists</h2>
<ol>
  <li>First numbered item</li>
  <li>Second numbered item</li>
  <li>Third numbered item with <strong>bold</strong> and <em>italic</em></li>
  <li>Fourth numbered item</li>
</ol>

<h2>Nested Lists</h2>
<ul>
  <li>Main item 1
    <ul>
      <li>Sub-item 1.1</li>
      <li>Sub-item 1.2</li>
    </ul>
  </li>
  <li>Main item 2
    <ol>
      <li>Numbered sub-item 2.1</li>
      <li>Numbered sub-item 2.2</li>
    </ol>
  </li>
</ul>

<h2>Mixed Content</h2>
<p>Here's a paragraph with some <strong>bold text</strong> and <em>italic text</em>.</p>
<blockquote>
  <p>This is a blockquote with important information.</p>
</blockquote>
<p>And here's another paragraph after the blockquote.</p>`)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">List Display Test</h1>
        <p className="text-gray-600">Testing how lists and other rich text elements are displayed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>React-Quill Editor</CardTitle>
            <p className="text-sm text-gray-600">Edit content to test list display</p>
          </CardHeader>
          <CardContent>
            <ReactQuillEditor
              value={content}
              onChange={setContent}
              placeholder="Start typing your rich content here..."
              minHeight="400px"
            />
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardHeader>
            <CardTitle>Rich Text Display</CardTitle>
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

      {/* Features Test */}
      <Card>
        <CardHeader>
          <CardTitle>Features Being Tested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">List Features</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Bullet lists (ul)</li>
                <li>✅ Numbered lists (ol)</li>
                <li>✅ Nested lists</li>
                <li>✅ Mixed list types</li>
                <li>✅ Lists with formatting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Other Features</h3>
              <ul className="space-y-1 text-sm">
                <li>✅ Headers (H1, H2, H3)</li>
                <li>✅ Bold and italic text</li>
                <li>✅ Links</li>
                <li>✅ Blockquotes</li>
                <li>✅ Paragraphs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 